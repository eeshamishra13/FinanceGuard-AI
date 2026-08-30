import {
  computePercentageChange,
  isSignificantChange,
  normalizeSignal,
  fetchUSDINR,
  getFuelReference,
  getRepoRateReference,
  collectAllSignals,
  mapSignalsToExposureShocks,
  getCachedSignal,
  setCachedSignal,
  clearSignalCache,
  type EconomicSignal,
} from "./signals.ts";
import { createBusinessTwin, createPersonalTwin } from "./adapters.ts";
import { calculateTwinExposureImpacts } from "./exposure.ts";
import { APEX_LOGISTICS_BUSINESS_INPUT } from "../frontend/data/demoCompany.ts";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

console.log("=================================================");
console.log("🧪 FINANCEGUARD EXTERNAL SIGNALS ENGINE TESTS");
console.log("=================================================\n");

// -------------------------------------------------------------
// 1. COMPUTE PERCENTAGE CHANGE TESTS
// -------------------------------------------------------------
console.log("▶ 1. Verifying computePercentageChange...");

// Normal positive & negative changes
assert(computePercentageChange(105, 100) === 5.0, "Normal positive change (100 -> 105 is +5%)");
assert(computePercentageChange(90, 100) === -10.0, "Normal negative change (100 -> 90 is -10%)");
assert(computePercentageChange(89.10, 86.45) === 3.07, "Precision decimals (86.45 -> 89.10 is +3.07%)");
assert(computePercentageChange(100, 100) === 0.0, "Zero change (100 -> 100 is 0%)");

// Zero previous value
assert(computePercentageChange(50, 0) === 100, "Zero previous with positive current returns 100%");
assert(computePercentageChange(-50, 0) === -100, "Zero previous with negative current returns -100%");
assert(computePercentageChange(0, 0) === 0, "Zero previous and zero current returns 0%");

// Zero current value
assert(computePercentageChange(0, 100) === -100.0, "Current zero (100 -> 0 is -100%)");

// Negative previous values
assert(computePercentageChange(-50, -100) === 50.0, "Negative previous improvement (-100 -> -50 is +50%)");
assert(computePercentageChange(-150, -100) === -50.0, "Negative previous deterioration (-100 -> -150 is -50%)");

// Non-finite guard
assert(computePercentageChange(NaN, 100) === 0, "NaN current value guarded to 0");
assert(computePercentageChange(100, Infinity) === 0, "Infinity previous value guarded to 0");

// -------------------------------------------------------------
// 2. IS SIGNIFICANT CHANGE TESTS
// -------------------------------------------------------------
console.log("\n▶ 2. Verifying isSignificantChange...");

// USD/INR threshold (2.0%)
assert(isSignificantChange(2.0, "usd_inr") === true, "USD/INR exactly at 2.0% threshold is significant");
assert(isSignificantChange(3.5, "usd_inr") === true, "USD/INR above 2.0% threshold is significant");
assert(isSignificantChange(1.99, "usd_inr") === false, "USD/INR below 2.0% threshold is not significant");
assert(isSignificantChange(-2.5, "usd_inr") === true, "USD/INR negative change beyond threshold is significant");
assert(isSignificantChange(-1.2, "usd_inr") === false, "USD/INR negative change below threshold is not significant");

// Fuel / Diesel threshold (3.0%)
assert(isSignificantChange(3.0, "fuel_diesel") === true, "Fuel exactly at 3.0% threshold is significant");
assert(isSignificantChange(4.2, "fuel_diesel") === true, "Fuel above 3.0% threshold is significant");
assert(isSignificantChange(2.9, "fuel_diesel") === false, "Fuel below 3.0% threshold is not significant");
assert(isSignificantChange(3.2, "diesel") === true, "Fuel alias 'diesel' matches 3.0% threshold");

// RBI Repo Rate threshold (> 0%)
assert(isSignificantChange(0.25, "rbi_repo") === true, "Repo rate move of +0.25% is significant");
assert(isSignificantChange(-0.5, "rbi_repo") === true, "Repo rate cut of -0.50% is significant");
assert(isSignificantChange(0.0, "rbi_repo") === false, "Repo rate unchanged (0%) is not significant");
assert(isSignificantChange(0.1, "interest_rate") === true, "Alias 'interest_rate' matches >0% repo threshold");

// Custom numeric threshold
assert(isSignificantChange(5.0, 5.0) === true, "Custom threshold: 5.0% at 5.0 threshold is significant");
assert(isSignificantChange(4.99, 5.0) === false, "Custom threshold: 4.99% below 5.0 threshold is not significant");

// -------------------------------------------------------------
// 3. EXPOSURE SHOCK MAPPING TESTS
// -------------------------------------------------------------
console.log("\n▶ 3. Verifying mapSignalsToExposureShocks...");

const twin = createBusinessTwin(APEX_LOGISTICS_BUSINESS_INPUT);
// twin.exposures has: "diesel", "interest_rate", "usd_inr"

const sampleSignals: EconomicSignal[] = [
  {
    key: "usd_inr",
    name: "USD / INR Exchange Rate",
    currentValue: 89.10,
    previousValue: 86.45,
    unit: "₹",
    percentageChange: 3.07,
    sourceType: "live_api",
    sourceName: "open.er-api.com",
    fetchedAt: "2026-08-30T05:30:00.000Z",
    isSignificantChange: true,
  },
  {
    key: "fuel_diesel",
    name: "Commercial Diesel Price",
    currentValue: 92.50,
    previousValue: 89.62,
    unit: "₹/L",
    percentageChange: 3.21,
    sourceType: "manual_reference",
    sourceName: "PPAC (verified 2026-08-15)",
    fetchedAt: "2026-08-30T05:30:00.000Z",
    isSignificantChange: true,
  },
  {
    key: "unrelated_crypto_signal",
    name: "Bitcoin Spot Index",
    currentValue: 65000,
    previousValue: 60000,
    unit: "$",
    percentageChange: 8.33,
    sourceType: "manual_reference",
    sourceName: "Crypto Feed",
    fetchedAt: "2026-08-30T05:30:00.000Z",
    isSignificantChange: true,
  },
];

const mappedShocks = mapSignalsToExposureShocks(twin, sampleSignals);

assert("usd_inr" in mappedShocks, "Mapped shocks contains matching 'usd_inr'");
assert(mappedShocks["usd_inr"].original === 86.45, "USD/INR shock original value is 86.45");
assert(mappedShocks["usd_inr"].shocked === 89.10, "USD/INR shock value is 89.10");

assert("diesel" in mappedShocks, "Mapped shocks contains matching 'diesel' via 'fuel_diesel' signal");
assert(mappedShocks["diesel"].original === 89.62, "Diesel shock original value is 89.62");
assert(mappedShocks["diesel"].shocked === 92.50, "Diesel shock value is 92.50");

assert(!("unrelated_crypto_signal" in mappedShocks), "Unmatched signal 'unrelated_crypto_signal' is silently skipped");

// Integration test with calculateTwinExposureImpacts
const impactResults = calculateTwinExposureImpacts(twin, mappedShocks);
assert(impactResults.impacts.length === 2, "Only 2 matching exposures produced impact results");
assert(impactResults.totalDeltaMonthlyOpEx > 0, "Deterministic OpEx impact calculated from mapped shocks");

// Test twin with zero matching exposures
const emptyExposuresTwin = { ...twin, exposures: [] };
const emptyShocks = mapSignalsToExposureShocks(emptyExposuresTwin, sampleSignals);
assert(Object.keys(emptyShocks).length === 0, "Twin with no exposures produces empty mapped shocks");

// -------------------------------------------------------------
// 4. COLLECTOR & MOCK FETCH TESTS
// -------------------------------------------------------------
console.log("\n▶ 4. Verifying Collectors, Cache, and Mock Fetch Fallback...");

clearSignalCache();

// Mock successful fetch
const mockSuccessFetch = (async () => {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({
      result: "success",
      rates: { INR: 91.25 },
    }),
  } as unknown as Response;
}) as typeof fetch;

const successSignal = await fetchUSDINR({ fetchFn: mockSuccessFetch });
assert(successSignal.key === "usd_inr", "fetchUSDINR returned signal with key 'usd_inr'");
assert(successSignal.currentValue === 91.25, "fetchUSDINR parsed live rate 91.25");
assert(successSignal.sourceType === "live_api", "fetchUSDINR labeled as 'live_api'");
assert(successSignal.sourceName.includes("open.er-api.com"), "fetchUSDINR includes sourceName");

// Verify cache was populated
const cached = getCachedSignal("usd_inr");
assert(cached !== undefined && cached.currentValue === 91.25, "Cache stores fetched USD/INR value");

// Mock network failure
const mockFailureFetch = (async () => {
  throw new Error("Network timeout connecting to currency API (ETIMEDOUT)");
}) as typeof fetch;

const fallbackSignal = await fetchUSDINR({ fetchFn: mockFailureFetch });
assert(fallbackSignal.key === "usd_inr", "Network failure returns safe signal without crashing");
assert(fallbackSignal.currentValue === 91.25, "Network failure safely falls back to last cached value");
assert(fallbackSignal.sourceName.includes("Cached fallback"), "Fallback sourceName indicates cached fallback");

// Manual Reference Collectors
const fuelRef = getFuelReference();
assert(fuelRef.key === "fuel_diesel", "Fuel reference has key 'fuel_diesel'");
assert(fuelRef.sourceType === "manual_reference", "Fuel reference explicitly labeled 'manual_reference'");
assert(fuelRef.currentValue === 92.50, "Fuel reference current value is 92.50");
assert(fuelRef.unit === "₹/L", "Fuel reference unit is ₹/L");

const repoRef = getRepoRateReference();
assert(repoRef.key === "rbi_repo", "Repo reference has key 'rbi_repo'");
assert(repoRef.sourceType === "manual_reference", "Repo reference explicitly labeled 'manual_reference'");
assert(repoRef.currentValue === 6.50, "Repo reference current value is 6.50%");
assert(repoRef.unit === "%", "Repo reference unit is %");

// collectAllSignals orchestrator
const allSignals = await collectAllSignals({ fetchFn: mockSuccessFetch });
assert(allSignals.length === 3, "collectAllSignals returns exactly 3 signals");
assert(allSignals.map((s) => s.key).join(",") === "usd_inr,fuel_diesel,rbi_repo", "Returns [usd_inr, fuel_diesel, rbi_repo]");
assert(allSignals[0].sourceType === "live_api", "USD/INR is live_api");
assert(allSignals[1].sourceType === "manual_reference", "Fuel is manual_reference");
assert(allSignals[2].sourceType === "manual_reference", "Repo is manual_reference");

console.log("\n=================================================");
console.log(`✅ FINAL SIGNALS SUITE: ${passed} passed, ${failed} failed`);
console.log("=================================================\n");

if (failed > 0) {
  process.exit(1);
}
