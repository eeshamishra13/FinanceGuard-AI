import type { FinancialTwinCore } from "./twinTypes.ts";
import { roundTo, safeDivide } from "./engine.ts";
import referenceData from "./referenceData.json" with { type: "json" };

export interface EconomicSignal {
  key: string;                    // "usd_inr", "fuel_diesel", "rbi_repo"
  name: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  percentageChange: number;       // computed, not stored
  sourceType: "live_api" | "manual_reference";
  sourceName: string;             // e.g. "open.er-api.com" or "PPAC (verified 2026-08-15)"
  fetchedAt: string;              // ISO timestamp of THIS fetch, always fresh for live_api
  isSignificantChange: boolean;   // see threshold logic below
}

export interface SignalCacheEntry {
  currentValue: number;
  previousValue: number;
  fetchedAt: string;
  sourceName: string;
  sourceType: "live_api" | "manual_reference";
}

/**
 * In-memory persistent cache for signals to compute previousValue diffs
 * and prevent redundant API hammering.
 */
const signalCache: Map<string, SignalCacheEntry> = new Map();

export function getCachedSignal(key: string): SignalCacheEntry | undefined {
  return signalCache.get(key);
}

export function setCachedSignal(key: string, entry: SignalCacheEntry): void {
  signalCache.set(key, entry);
}

export function clearSignalCache(): void {
  signalCache.clear();
}

/**
 * 3. Change Detector: Computes percentage change between current and previous values.
 * Handles edge cases: previous = 0, negative values, and NaN/Infinity.
 */
export function computePercentageChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return 0;
  }

  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }

  // Use absolute value of previous to correctly handle negative baseline directions
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return roundTo(change, 2);
}

/**
 * 3. Change Detector: Determines if the change breaches significance thresholds.
 * Thresholds:
 * - FX (usd_inr): 2.0%
 * - Fuel (fuel_diesel / diesel / fuel): 3.0%
 * - Interest / Repo (rbi_repo / interest_rate): > 0% (any discrete change is significant)
 * - Custom numeric threshold: Math.abs(pctChange) >= threshold
 */
export function isSignificantChange(
  pctChange: number,
  keyOrThreshold: string | number
): boolean {
  if (!Number.isFinite(pctChange)) {
    return false;
  }

  if (typeof keyOrThreshold === "number") {
    return Math.abs(pctChange) >= keyOrThreshold;
  }

  const normalizedKey = keyOrThreshold.toLowerCase();

  if (normalizedKey.includes("repo") || normalizedKey.includes("interest")) {
    return Math.abs(pctChange) > 0;
  }

  if (normalizedKey.includes("fuel") || normalizedKey.includes("diesel")) {
    return Math.abs(pctChange) >= 3.0;
  }

  if (normalizedKey.includes("usd") || normalizedKey.includes("inr") || normalizedKey.includes("fx")) {
    return Math.abs(pctChange) >= 2.0;
  }

  return Math.abs(pctChange) >= 2.0;
}

/**
 * 4. Normalizer: Maps raw signal inputs into the canonical EconomicSignal schema.
 */
export function normalizeSignal(params: {
  key: string;
  name: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  sourceType: "live_api" | "manual_reference";
  sourceName: string;
  fetchedAt?: string;
  customThreshold?: number;
}): EconomicSignal {
  const percentageChange = computePercentageChange(params.currentValue, params.previousValue);
  const isSignificant = isSignificantChange(
    percentageChange,
    params.customThreshold !== undefined ? params.customThreshold : params.key
  );

  return {
    key: params.key,
    name: params.name,
    currentValue: params.currentValue,
    previousValue: params.previousValue,
    unit: params.unit,
    percentageChange,
    sourceType: params.sourceType,
    sourceName: params.sourceName,
    fetchedAt: params.fetchedAt || new Date().toISOString(),
    isSignificantChange: isSignificant,
  };
}

/**
 * 1. Collector: USD/INR live API fetcher.
 * Genuine network call to open.er-api.com with 5-second timeout and cache fallback.
 */
export async function fetchUSDINR(options?: {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  apiUrl?: string;
}): Promise<EconomicSignal> {
  const fetchImpl = options?.fetchFn || fetch;
  const timeoutMs = options?.timeoutMs || 5000;
  const apiUrl = options?.apiUrl || "https://open.er-api.com/v6/latest/USD";

  const cached = getCachedSignal("usd_inr");
  const fallbackRef = referenceData.usd_inr_fallback;

  let previousValue = cached ? cached.currentValue : fallbackRef.previousValue;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetchImpl(apiUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const liveRate = data?.rates?.INR;

    if (typeof liveRate !== "number" || !Number.isFinite(liveRate) || liveRate <= 0) {
      throw new Error("Invalid rate payload received from currency API");
    }

    const currentRate = roundTo(liveRate, 2);

    // If no prior cached previous value, compare with fallback baseline
    if (!cached) {
      previousValue = fallbackRef.previousValue;
    }

    const fetchedAt = new Date().toISOString();
    const sourceName = "open.er-api.com (Live FX Feed)";

    // Update in-memory cache
    setCachedSignal("usd_inr", {
      currentValue: currentRate,
      previousValue,
      fetchedAt,
      sourceName,
      sourceType: "live_api",
    });

    return normalizeSignal({
      key: "usd_inr",
      name: "USD / INR Exchange Rate",
      currentValue: currentRate,
      previousValue,
      unit: "₹",
      sourceType: "live_api",
      sourceName,
      fetchedAt,
    });
  } catch (err) {
    // Graceful fallback to cache or referenceData
    const currentRate = cached ? cached.currentValue : fallbackRef.currentValue;
    const prevRate = cached ? cached.previousValue : fallbackRef.previousValue;
    const fetchedAt = new Date().toISOString();
    const sourceName = cached
      ? `${cached.sourceName} (Cached fallback)`
      : `${fallbackRef.sourceName}`;

    return normalizeSignal({
      key: "usd_inr",
      name: "USD / INR Exchange Rate",
      currentValue: currentRate,
      previousValue: prevRate,
      unit: "₹",
      sourceType: cached ? cached.sourceType : "manual_reference",
      sourceName,
      fetchedAt,
    });
  }
}

/**
 * 1. Collector: Fuel / Diesel reference data getter.
 */
export function getFuelReference(): EconomicSignal {
  const ref = referenceData.fuel_diesel;
  return normalizeSignal({
    key: ref.key,
    name: ref.name,
    currentValue: ref.currentValue,
    previousValue: ref.previousValue,
    unit: ref.unit,
    sourceType: "manual_reference",
    sourceName: ref.sourceName,
    fetchedAt: new Date().toISOString(),
  });
}

/**
 * 1. Collector: RBI Repo Rate reference data getter.
 */
export function getRepoRateReference(): EconomicSignal {
  const ref = referenceData.rbi_repo;
  return normalizeSignal({
    key: ref.key,
    name: ref.name,
    currentValue: ref.currentValue,
    previousValue: ref.previousValue,
    unit: ref.unit,
    sourceType: "manual_reference",
    sourceName: ref.sourceName,
    fetchedAt: new Date().toISOString(),
  });
}

/**
 * Collects all 3 signals (USD/INR live, Fuel/diesel reference, RBI repo rate reference).
 */
export async function collectAllSignals(options?: {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): Promise<EconomicSignal[]> {
  const [usdInr, fuel, repo] = await Promise.all([
    fetchUSDINR(options),
    Promise.resolve(getFuelReference()),
    Promise.resolve(getRepoRateReference()),
  ]);

  return [usdInr, fuel, repo];
}

/**
 * Glue function: Maps EconomicSignal objects to the exact signalShocks record format
 * expected by calculateTwinExposureImpacts(twin, signalShocks).
 * 
 * Rules:
 * - For each signal, checks if twin.exposures has a matching signalKey.
 * - If yes, builds { original, shocked, name } pair.
 * - If no matching exposure exists, skips silently.
 */
export function mapSignalsToExposureShocks(
  twin: FinancialTwinCore,
  signals: EconomicSignal[]
): Record<string, { original: number; shocked: number; name?: string }> {
  const shocks: Record<string, { original: number; shocked: number; name?: string }> = {};

  for (const signal of signals) {
    // Find if twin has an exposure matching this signal key
    // Matches exact signalKey, or standard aliases ("diesel"/"fuel" for "fuel_diesel", "interest_rate" for "rbi_repo")
    const matchingExposure = twin.exposures.find((exp) => {
      if (exp.signalKey === signal.key) return true;
      if (signal.key === "fuel_diesel" && (exp.signalKey === "diesel" || exp.signalKey === "fuel")) return true;
      if (signal.key === "rbi_repo" && exp.signalKey === "interest_rate") return true;
      return false;
    });

    if (matchingExposure) {
      shocks[matchingExposure.signalKey] = {
        original: signal.previousValue,
        shocked: signal.currentValue,
        name: signal.name,
      };
    }
  }

  return shocks;
}