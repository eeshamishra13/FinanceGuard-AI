import type {
  FinancialProfile,
  DerivedMetrics,
  ForecastPoint,
  SimulationScenario,
  SimulationResult,
} from "./types.ts";

import {
  DEMO_FINANCIAL_PROFILE,
  JOB_LOSS_3_MONTHS,
  RENT_INCREASE_15_PERCENT,
  EMERGENCY_EXPENSE_50K,
  INCOME_INCREASE_20_PERCENT,
  REDUCE_DISCRETIONARY_5K,
  PRESET_SCENARIO_REGISTRY,
  getPresetScenarios,
} from "./demoData.ts";

// Re-export types and demo data for convenient single-point integration
export type * from "./types.ts";
export * from "./demoData.ts";

/**
 * Rounds a number to the specified number of decimal places.
 * Safely handles NaN, Infinity, and -Infinity by returning 0.
 */
export const roundTo = (
  num: number,
  decimals: number = 2
): number => {
  if (isNaN(num) || !isFinite(num)) return 0;

  const factor = Math.pow(10, decimals);

  return Math.round(num * factor) / factor;
};

/**
 * Safely divides two numbers, guarding against division by zero and invalid values.
 */
export const safeDivide = (
  numerator: number,
  denominator: number
): number => {
  if (!denominator || denominator === 0) return 0;

  const result = numerator / denominator;

  return isFinite(result) ? result : 0;
};

/**
 * Formats a currency amount into standard Indian Rupee (INR) representation.
 */
export const formatINR = (amount: number): string => {
  if (!Number.isFinite(amount)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Normalizes durationMonths to a safe positive integer or undefined.
 * Guards against 0, negative numbers, non-integers, NaN, Infinity, and invalid types.
 */
const normalizeDuration = (duration?: number): number | undefined => {
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    return undefined;
  }
  return Math.floor(duration);
};

/**
 * Calculates all derived metrics and resilience scores for a financial profile.
 */
export const calculateDerived = (
  profile: FinancialProfile
): DerivedMetrics => {
  // Total expenses: essential + discretionary
  const totalExpenses = profile.essentialExpenses + profile.discretionaryExpenses;

  // Total income: regular income + other income
  const totalIncome = profile.income + profile.otherIncome;

  // Monthly savings: total income - total expenses
  const monthlySavings = totalIncome - totalExpenses;

  // Savings rate: monthly savings / total income * 100
  const rawSavingsRate = totalIncome === 0 ? 0 : safeDivide(monthlySavings, totalIncome) * 100;

  // Monthly burn: essential expenses + monthly debt payments
  const monthlyBurn = profile.essentialExpenses + profile.monthlyDebtPayment;

  // Net worth: savings + investments + emergency fund - debt
  const netWorth = profile.savings + profile.investments + profile.emergencyFund - profile.debt;

  // Emergency runway: emergency fund / monthly burn
  const runwayMonths = safeDivide(profile.emergencyFund, monthlyBurn);

  // --- Resilience Score Components (0–100) ---

  // 1. Emergency Fund — 30 points (6+ months = 30 pts, 0 months = 0 pts, linear scaling)
  const emergencyFundScore = Math.min(30, Math.max(0, safeDivide(runwayMonths, 6) * 30));

  // 2. Savings Rate — 25 points (40%+ = 25 pts, 0% = 0 pts, linear scaling; negative rate = 0)
  const savingsRateScore = rawSavingsRate <= 0
    ? 0
    : Math.min(25, Math.max(0, safeDivide(rawSavingsRate, 40) * 25));

  // 3. Debt Burden — 20 points (monthlyDebtPayment / totalIncome)
  // 0% debt ratio = 20 pts, 40%+ debt ratio = 0 pts, linear decrease
  // If totalIncome === 0 AND monthlyDebtPayment > 0 => debtRatio = 1.0 => 0 pts
  // If both totalIncome === 0 AND monthlyDebtPayment === 0 => 20 pts
  let debtBurdenScore = 20;
  if (totalIncome === 0 && profile.monthlyDebtPayment > 0) {
    debtBurdenScore = 0;
  } else if (totalIncome === 0 && profile.monthlyDebtPayment === 0) {
    debtBurdenScore = 20;
  } else {
    const debtRatio = safeDivide(profile.monthlyDebtPayment, totalIncome);
    if (debtRatio >= 0.4) {
      debtBurdenScore = 0;
    } else if (debtRatio <= 0) {
      debtBurdenScore = 20;
    } else {
      debtBurdenScore = Math.min(20, Math.max(0, 20 * (1 - safeDivide(debtRatio, 0.4))));
    }
  }

  // 4. Expense Stability — 15 points (discretionaryExpenses / totalExpenses)
  // <20% = 15 pts, 60%+ = 0 pts, linear scaling between 20% and 60%
  // If total expenses are zero, safely give full 15 points
  let expenseStabilityScore = 15;
  if (totalExpenses > 0) {
    const discretionaryRatio = safeDivide(profile.discretionaryExpenses, totalExpenses);
    if (discretionaryRatio <= 0.2) {
      expenseStabilityScore = 15;
    } else if (discretionaryRatio >= 0.6) {
      expenseStabilityScore = 0;
    } else {
      const normalizedRatio = safeDivide(discretionaryRatio - 0.2, 0.4);
      expenseStabilityScore = Math.min(15, Math.max(0, 15 * (1 - normalizedRatio)));
    }
  }

  // 5. Income Stability — 10 points
  // MVP placeholder.
  // Future version should calculate income stability from historical income variance.
  const incomeStabilityScore = 10;

  // Composite Resilience Score: sum of all pillars capped between 0 and 100
  const totalScore = emergencyFundScore + savingsRateScore + debtBurdenScore + expenseStabilityScore + incomeStabilityScore;
  const boundedScore = Math.min(100, Math.max(0, totalScore));
  const finalResilienceScore = roundTo(boundedScore, 0);

  // Resilience Band: 0–39 critical, 40–69 warning, 70–100 healthy
  let resilienceBand: "critical" | "warning" | "healthy";
  if (finalResilienceScore <= 39) {
    resilienceBand = "critical";
  } else if (finalResilienceScore <= 69) {
    resilienceBand = "warning";
  } else {
    resilienceBand = "healthy";
  }

  return {
    totalExpenses: roundTo(totalExpenses, 0),
    monthlySavings: roundTo(monthlySavings, 0),
    savingsRate: roundTo(rawSavingsRate, 2),
    monthlyBurn: roundTo(monthlyBurn, 0),
    netWorth: roundTo(netWorth, 0),
    runwayMonths: roundTo(runwayMonths, 1),
    resilienceScore: finalResilienceScore,
    resilienceBand,
    resilienceBreakdown: {
      emergencyFund: roundTo(emergencyFundScore, 2),
      savingsRate: roundTo(savingsRateScore, 2),
      debtBurden: roundTo(debtBurdenScore, 2),
      expenseStability: roundTo(expenseStabilityScore, 2),
      incomeStability: roundTo(incomeStabilityScore, 2),
    },
  };
};

/**
 * Applies simulation parameters to a financial profile without mutating the original object.
 */
export const applyScenario = (
  profile: FinancialProfile,
  scenario: SimulationScenario
): FinancialProfile => {
  const modified: FinancialProfile = { ...profile };

  // Income change (e.g. -25% -> income * 0.75; -100% -> 0; clamped at 0)
  if (scenario.incomeChangePercent !== undefined) {
    const factor = 1 + scenario.incomeChangePercent / 100;
    modified.income = Math.max(0, roundTo(modified.income * factor, 0));
  }

  // Rent / essential expenses change (e.g. +15% -> essentialExpenses * 1.15; clamped at 0)
  if (scenario.rentChangePercent !== undefined) {
    const factor = 1 + scenario.rentChangePercent / 100;
    modified.essentialExpenses = Math.max(0, roundTo(modified.essentialExpenses * factor, 0));
  }

  // EMI / debt payment change (clamped at 0)
  if (scenario.emiChangePercent !== undefined) {
    const factor = 1 + scenario.emiChangePercent / 100;
    modified.monthlyDebtPayment = Math.max(0, roundTo(modified.monthlyDebtPayment * factor, 0));
  }

  // Unexpected lump-sum expense (draws down emergency fund first, then savings, clamped at 0)
  if (scenario.unexpectedExpense !== undefined && scenario.unexpectedExpense > 0) {
    const expense = scenario.unexpectedExpense;
    if (modified.emergencyFund >= expense) {
      modified.emergencyFund = roundTo(modified.emergencyFund - expense, 0);
    } else {
      const remainingExpense = expense - modified.emergencyFund;
      modified.emergencyFund = 0;
      modified.savings = Math.max(0, roundTo(modified.savings - remainingExpense, 0));
    }
  }

  // Discretionary spending reduction (clamped at 0)
  if (scenario.discretionaryReductionAmount !== undefined) {
    modified.discretionaryExpenses = Math.max(0, roundTo(modified.discretionaryExpenses - scenario.discretionaryReductionAmount, 0));
  }

  // Savings boost (discretionary spending reduced by equivalent amount, clamped at 0)
  if (scenario.savingsBoostAmount !== undefined) {
    modified.discretionaryExpenses = Math.max(0, roundTo(modified.discretionaryExpenses - scenario.savingsBoostAmount, 0));
  }

  return modified;
};

/**
 * Generates monthly trend projections.
 * Enforces the drawdown priority rule:
 * When cash flow is negative, draw down emergency fund first, then savings.
 * Neither liquid asset is ever allowed to fall below zero.
 */
export const forecastTrend = (
  profile: FinancialProfile,
  months: number = 6
): ForecastPoint[] => {
  const safeMonths = typeof months === "number" && Number.isFinite(months) && months > 0
    ? Math.floor(months)
    : 6;
  const points: ForecastPoint[] = [];
  const current: FinancialProfile = { ...profile };

  for (let month = 1; month <= safeMonths; month++) {
    const totalIncome = current.income + current.otherIncome;
    const totalExpenses = current.essentialExpenses + current.discretionaryExpenses;
    const monthlyCashflow = totalIncome - totalExpenses;

    if (monthlyCashflow >= 0) {
      // Positive cash flow: accumulate into savings
      current.savings = roundTo(current.savings + monthlyCashflow, 0);
    } else {
      // Negative cash flow: draw down emergency fund first, then savings
      const deficit = Math.abs(monthlyCashflow);
      if (current.emergencyFund >= deficit) {
        current.emergencyFund = roundTo(current.emergencyFund - deficit, 0);
      } else {
        const remainingDeficit = deficit - current.emergencyFund;
        current.emergencyFund = 0;
        current.savings = Math.max(0, roundTo(current.savings - remainingDeficit, 0));
      }
    }

    const metrics = calculateDerived(current);
    points.push({
      month,
      netWorth: metrics.netWorth,
      runway: metrics.runwayMonths,
      resilience: metrics.resilienceScore,
    });
  }

  return points;
};

/**
 * Generates an offline, deterministic narrative explaining scenario causes and outcomes.
 */
const generateDeterministicNarrative = (
  baselineProfile: FinancialProfile,
  scenarioProfile: FinancialProfile,
  scenario: SimulationScenario,
  baselineMetrics: DerivedMetrics,
  scenarioMetrics: DerivedMetrics,
  scenarioProjection: ForecastPoint[]
): { cause: string; topFactors: string[] } => {
  const deltaResilience = scenarioMetrics.resilienceScore - baselineMetrics.resilienceScore;
  const factors: string[] = [];
  let cause = "";

  const validDuration = normalizeDuration(scenario.durationMonths);

  // Check if projection shows runway drawdown
  const minProjectedRunway = scenarioProjection.length > 0
    ? Math.min(...scenarioProjection.map((p) => p.runway))
    : scenarioMetrics.runwayMonths;

  // Identify factors based on actual scenario drivers
  if (scenario.incomeChangePercent !== undefined && scenario.incomeChangePercent < 0) {
    factors.push("Income drop");
  }
  if (scenarioMetrics.monthlySavings < 0) {
    factors.push("Negative cash flow");
  }
  if (scenarioMetrics.runwayMonths < baselineMetrics.runwayMonths || minProjectedRunway < baselineMetrics.runwayMonths) {
    factors.push("Reduced runway");
  }
  if (scenario.rentChangePercent !== undefined && scenario.rentChangePercent > 0) {
    factors.push("Higher expenses");
  }
  if (scenario.unexpectedExpense !== undefined && scenario.unexpectedExpense > 0) {
    factors.push("Unexpected expense");
  }
  if (scenario.emiChangePercent !== undefined && scenario.emiChangePercent > 0) {
    factors.push("Higher debt burden");
  }
  if (scenarioMetrics.monthlySavings < baselineMetrics.monthlySavings && scenarioMetrics.monthlySavings >= 0) {
    factors.push("Lower savings");
  }
  if (scenario.incomeChangePercent !== undefined && scenario.incomeChangePercent > 0) {
    factors.push("Income growth");
  }
  if ((scenario.discretionaryReductionAmount && scenario.discretionaryReductionAmount > 0) ||
      (scenario.savingsBoostAmount && scenario.savingsBoostAmount > 0)) {
    factors.push("Expense optimization");
  }
  if (scenarioMetrics.monthlySavings > baselineMetrics.monthlySavings) {
    factors.push("Higher savings");
  }

  // Construct specific deterministic cause sentences
  if (scenario.incomeChangePercent !== undefined && scenario.incomeChangePercent <= -100) {
    const durationText = validDuration !== undefined ? ` for ${validDuration} months` : "";
    let runwayEnd = minProjectedRunway;
    if (
      validDuration !== undefined &&
      validDuration >= 1 &&
      validDuration <= scenarioProjection.length
    ) {
      const targetPoint = scenarioProjection[validDuration - 1];
      if (targetPoint && typeof targetPoint.runway === "number") {
        runwayEnd = targetPoint.runway;
      }
    }
    cause = `Your resilience dropped from ${baselineMetrics.resilienceScore} to ${scenarioMetrics.resilienceScore} (${deltaResilience} pts) because monthly income fell 100%${durationText}, turning your monthly cash flow negative to ${formatINR(scenarioMetrics.monthlySavings)} and shrinking your emergency runway from ${baselineMetrics.runwayMonths} to ${runwayEnd} months.`;
  } else if (scenario.incomeChangePercent !== undefined && scenario.incomeChangePercent < 0) {
    cause = `Your resilience dropped by ${Math.abs(deltaResilience)} pts because monthly income decreased by ${Math.abs(scenario.incomeChangePercent)}%, shifting your monthly savings from ${formatINR(baselineMetrics.monthlySavings)} to ${formatINR(scenarioMetrics.monthlySavings)} and lowering your savings rate to ${scenarioMetrics.savingsRate}%.`;
  } else if (scenario.rentChangePercent !== undefined && scenario.rentChangePercent > 0) {
    const expenseDiff = scenarioProfile.essentialExpenses - baselineProfile.essentialExpenses;
    cause = `Your resilience score shifted by ${deltaResilience} pts due to a ${scenario.rentChangePercent}% increase in essential expenses (+${formatINR(expenseDiff)}/month), reducing your monthly savings from ${formatINR(baselineMetrics.monthlySavings)} to ${formatINR(scenarioMetrics.monthlySavings)}.`;
  } else if (scenario.unexpectedExpense !== undefined && scenario.unexpectedExpense > 0) {
    cause = `Your resilience score shifted by ${deltaResilience} pts due to an immediate unexpected expense of ${formatINR(scenario.unexpectedExpense)}, reducing your emergency fund to ${formatINR(scenarioProfile.emergencyFund)} and shrinking your runway from ${baselineMetrics.runwayMonths} to ${scenarioMetrics.runwayMonths} months.`;
  } else if (scenario.emiChangePercent !== undefined && scenario.emiChangePercent > 0) {
    const emiDiff = scenarioProfile.monthlyDebtPayment - baselineProfile.monthlyDebtPayment;
    cause = `Your resilience score dropped by ${Math.abs(deltaResilience)} pts due to a ${scenario.emiChangePercent}% hike in debt EMI payments (+${formatINR(emiDiff)}/month), increasing your debt burden and reducing monthly savings.`;
  } else if ((scenario.discretionaryReductionAmount && scenario.discretionaryReductionAmount > 0) ||
             (scenario.savingsBoostAmount && scenario.savingsBoostAmount > 0)) {
    const savingsGain = scenarioMetrics.monthlySavings - baselineMetrics.monthlySavings;
    cause = `Your resilience score improved by +${deltaResilience} pts by optimizing expenses (+${formatINR(savingsGain)}/month), boosting your savings rate to ${scenarioMetrics.savingsRate}% and increasing your monthly savings to ${formatINR(scenarioMetrics.monthlySavings)}.`;
  } else if (scenario.incomeChangePercent !== undefined && scenario.incomeChangePercent > 0) {
    cause = `Your resilience score improved by +${deltaResilience} pts due to a ${scenario.incomeChangePercent}% income increase, raising monthly savings from ${formatINR(baselineMetrics.monthlySavings)} to ${formatINR(scenarioMetrics.monthlySavings)} and savings rate to ${scenarioMetrics.savingsRate}%.`;
  } else {
    cause = `Your resilience score moved from ${baselineMetrics.resilienceScore} (${baselineMetrics.resilienceBand}) to ${scenarioMetrics.resilienceScore} (${scenarioMetrics.resilienceBand}), with monthly savings shifting by ${formatINR(scenarioMetrics.monthlySavings - baselineMetrics.monthlySavings)} and runway at ${scenarioMetrics.runwayMonths} months.`;
  }

  // Guarantee 1-3 top factors
  const topFactors = factors.length > 0 ? factors.slice(0, 3) : ["Stable cash flow"];

  return { cause, topFactors };
};

/**
 * Runs a complete what-if simulation comparing baseline against a scenario.
 * Supports duration-limited scenarios (e.g. 3-month job loss recovering at month 4).
 */
export const runSimulation = (
  baselineProfile: FinancialProfile,
  scenario: SimulationScenario
): SimulationResult => {
  // 1. Calculate baseline metrics
  const baseline = calculateDerived(baselineProfile);

  // 2. Apply scenario to produce immediate scenario profile
  const scenarioProfile = applyScenario(baselineProfile, scenario);

  // 3. Calculate scenario metrics
  const scenarioMetrics = calculateDerived(scenarioProfile);

  // 4. Calculate deltas (scenario - baseline)
  const delta = {
    resilience: roundTo(scenarioMetrics.resilienceScore - baseline.resilienceScore, 0),
    runway: roundTo(scenarioMetrics.runwayMonths - baseline.runwayMonths, 1),
    monthlySavings: roundTo(scenarioMetrics.monthlySavings - baseline.monthlySavings, 0),
  };

  // 5. Generate 6-month baseline projection
  const baselineProjection = forecastTrend(baselineProfile, 6);

  // 6. Generate 6-month scenario projection (accounting for durationMonths if specified)
  const scenarioProjection: ForecastPoint[] = [];
  const currentScenarioState: FinancialProfile = { ...scenarioProfile };
  const validDuration = normalizeDuration(scenario.durationMonths);

  for (let month = 1; month <= 6; month++) {
    // If a valid duration is specified and has elapsed, recurring income reverts to baseline
    // CRITICAL FIX: Do NOT reset essentialExpenses, discretionaryExpenses, or monthlyDebtPayment.
    if (validDuration !== undefined && month > validDuration) {
      currentScenarioState.income = baselineProfile.income;
      currentScenarioState.otherIncome = baselineProfile.otherIncome;
    }

    const totalIncome = currentScenarioState.income + currentScenarioState.otherIncome;
    const totalExpenses = currentScenarioState.essentialExpenses + currentScenarioState.discretionaryExpenses;
    const monthlyCashflow = totalIncome - totalExpenses;

    if (monthlyCashflow >= 0) {
      currentScenarioState.savings = roundTo(currentScenarioState.savings + monthlyCashflow, 0);
    } else {
      const deficit = Math.abs(monthlyCashflow);
      if (currentScenarioState.emergencyFund >= deficit) {
        currentScenarioState.emergencyFund = roundTo(currentScenarioState.emergencyFund - deficit, 0);
      } else {
        const remainingDeficit = deficit - currentScenarioState.emergencyFund;
        currentScenarioState.emergencyFund = 0;
        currentScenarioState.savings = Math.max(0, roundTo(currentScenarioState.savings - remainingDeficit, 0));
      }
    }

    const projectedMetrics = calculateDerived(currentScenarioState);
    scenarioProjection.push({
      month,
      netWorth: projectedMetrics.netWorth,
      runway: projectedMetrics.runwayMonths,
      resilience: projectedMetrics.resilienceScore,
    });
  }

  // 7 & 8. Generate deterministic narrative and top contributing factors
  const narrative = generateDeterministicNarrative(
    baselineProfile,
    scenarioProfile,
    scenario,
    baseline,
    scenarioMetrics,
    scenarioProjection
  );

  return {
    baseline,
    scenario: scenarioMetrics,
    delta,
    monthlyProjection: {
      baseline: baselineProjection,
      scenario: scenarioProjection,
    },
    narrative,
  };
};
