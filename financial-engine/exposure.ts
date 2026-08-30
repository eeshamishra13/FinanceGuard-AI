import type {
  ConfidenceLevel,
  EstimationMethod,
  ExposureImpactResult,
  ExposureVector,
  FinancialTwinCore,
  TransactionCategory,
} from "./twinTypes.ts";
import { roundTo, safeDivide } from "./engine.ts";

/**
 * Industry / Category Prior Beta Sensitivities
 */
export const CATEGORY_BETA_PRIORS: Record<TransactionCategory, number> = {
  Fuel: 0.32,
  Logistics: 0.28,
  Payroll: 0.05,
  Rent: 0.02,
  Utilities: 0.15,
  Inventory: 0.22,
  "Debt Service": 0.35, // Sensitive to interest rate signals
  Revenue: 1.0,
  Tax: 0.0,
  Food: 0.12,
  Transport: 0.25,
  Healthcare: 0.08,
  Discretionary: 0.18,
  Other: 0.10,
};

/**
 * Computes the estimated beta using empirical shrinkage based on data points.
 * 
 * @param sampleCount Number of historical monthly data points available
 * @param empiricalBeta Beta derived from historical correlation / regression
 * @param category Transaction category for prior retrieval
 */
export function estimateBetaWithShrinkage(
  sampleCount: number,
  empiricalBeta: number | undefined,
  category: TransactionCategory
): { beta: number; confidence: ConfidenceLevel; method: EstimationMethod } {
  const prior = CATEGORY_BETA_PRIORS[category] ?? 0.15;

  if (sampleCount < 3 || empiricalBeta === undefined || !Number.isFinite(empiricalBeta)) {
    return {
      beta: roundTo(prior, 2),
      confidence: "low",
      method: "prior",
    };
  }

  if (sampleCount < 12) {
    // Medium data: weight w scales linearly between 3 and 12 months
    const weight = safeDivide(sampleCount - 3, 9); // 0.0 to 1.0
    const blended = weight * empiricalBeta + (1 - weight) * prior;
    return {
      beta: roundTo(Math.max(0, Math.min(2.5, blended)), 2),
      confidence: "medium",
      method: "shrinkage",
    };
  }

  // High data: statistical regression dominates
  return {
    beta: roundTo(Math.max(0, Math.min(2.5, empiricalBeta)), 2),
    confidence: "high",
    method: "regression",
  };
}

/**
 * Calculates the exact monetary delta for a single exposure vector under a signal shock.
 * 
 * Formula:
 * Percentage Change: ΔS = (ShockedValue - OriginalValue) / OriginalValue
 * Cost Delta: ΔCost = β * ΔS * BaselineMonthlySpend
 */
export function calculateSingleExposureImpact(
  exposure: ExposureVector,
  originalSignalValue: number,
  shockedSignalValue: number,
  signalName: string = "Economic Indicator"
): ExposureImpactResult {
  if (originalSignalValue <= 0 || !Number.isFinite(originalSignalValue)) {
    return {
      signalKey: exposure.signalKey,
      signalName,
      originalValue: originalSignalValue,
      shockedValue: shockedSignalValue,
      percentageChange: 0,
      beta: exposure.beta,
      confidence: exposure.confidence,
      method: exposure.method,
      baselineMonthlySpend: exposure.baselineMonthlySpend,
      deltaMonthlyCost: 0,
      revisedMonthlyCost: exposure.baselineMonthlySpend,
    };
  }

  const percentageChange = safeDivide(
    shockedSignalValue - originalSignalValue,
    originalSignalValue
  );

  const deltaMonthlyCost = roundTo(
    exposure.beta * percentageChange * exposure.baselineMonthlySpend,
    0
  );

  const revisedMonthlyCost = roundTo(
    Math.max(0, exposure.baselineMonthlySpend + deltaMonthlyCost),
    0
  );

  return {
    signalKey: exposure.signalKey,
    signalName,
    originalValue: originalSignalValue,
    shockedValue: shockedSignalValue,
    percentageChange: roundTo(percentageChange * 100, 2),
    beta: exposure.beta,
    confidence: exposure.confidence,
    method: exposure.method,
    baselineMonthlySpend: exposure.baselineMonthlySpend,
    deltaMonthlyCost,
    revisedMonthlyCost,
  };
}

/**
 * Calculates aggregate OpEx impact across all active exposure vectors for a Financial Twin.
 */
export function calculateTwinExposureImpacts(
  twin: FinancialTwinCore,
  signalShocks: Record<string, { original: number; shocked: number; name?: string }>
): {
  impacts: ExposureImpactResult[];
  totalDeltaMonthlyOpEx: number;
  revisedTotalMonthlyBurn: number;
} {
  const impacts: ExposureImpactResult[] = [];
  let totalDelta = 0;

  for (const exp of twin.exposures) {
    const shock = signalShocks[exp.signalKey];
    if (shock) {
      const impact = calculateSingleExposureImpact(
        exp,
        shock.original,
        shock.shocked,
        shock.name || exp.signalKey
      );
      impacts.push(impact);
      totalDelta += impact.deltaMonthlyCost;
    }
  }

  return {
    impacts,
    totalDeltaMonthlyOpEx: roundTo(totalDelta, 0),
    revisedTotalMonthlyBurn: roundTo(Math.max(0, twin.totalMonthlyBurn + totalDelta), 0),
  };
}
