import type { FinancialTwinCore, MonteCarloRunwayResult } from "./twinTypes.ts";
import { roundTo, safeDivide } from "./engine.ts";

/**
 * Seeded PRNG (Mulberry32) ensuring 100% reproducible simulation outputs.
 */
function createSeededRandom(seed: number) {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an approximate standard normal deviate using Box-Muller transform.
 */
function nextGaussian(rng: () => number, mean = 0, stdDev = 1): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export interface MonteCarloConfig {
  simulationsCount?: number; // default 1000
  seed?: number;             // default 42
  maxHorizonMonths?: number; // default 36
  revenueStdDev?: number;    // default 0.15 (15% annual/monthly volatility)
  expenseStdDev?: number;    // default 0.10 (10% cost fluctuation)
  activeShockFactor?: number;// e.g. 1.25 for a +25% fuel shock
}

/**
 * Executes a deterministic 1,000-run Monte Carlo simulation using independent shock distributions.
 */
export function runMonteCarloRunway(
  twin: FinancialTwinCore,
  config?: MonteCarloConfig
): MonteCarloRunwayResult {
  const numSims = config?.simulationsCount ?? 1000;
  const seed = config?.seed ?? 42;
  const maxHorizon = config?.maxHorizonMonths ?? 36;
  const revVol = config?.revenueStdDev ?? 0.15;
  const expVol = config?.expenseStdDev ?? 0.10;
  const shockFactor = config?.activeShockFactor ?? 1.0;

  const rng = createSeededRandom(seed);
  const simulatedRunways: number[] = new Array(numSims);

  const baselineInflow = twin.monthlyInflow;
  const baselineTotalBurn = twin.totalMonthlyBurn * shockFactor;
  const startingLiquidCash = Math.max(0, twin.totalLiquidCash);

  for (let sim = 0; sim < numSims; sim++) {
    let currentCash = startingLiquidCash;
    let monthsSurviving = 0;

    for (let m = 1; m <= maxHorizon; m++) {
      // Independent stochastic shocks per month
      const revShock = Math.max(0.1, 1.0 + nextGaussian(rng, 0, revVol));
      const expShock = Math.max(0.6, 1.0 + nextGaussian(rng, 0, expVol));

      const monthlyInflow = baselineInflow * revShock;
      const monthlyOutflow = baselineTotalBurn * expShock + twin.discretionaryExpenses;
      const netCashflow = monthlyInflow - monthlyOutflow;

      if (netCashflow >= 0) {
        currentCash += netCashflow;
        monthsSurviving = m;
      } else {
        const deficit = Math.abs(netCashflow);
        if (currentCash >= deficit) {
          currentCash -= deficit;
          monthsSurviving = m;
        } else {
          // Fraction of month remaining
          const fractionalMonth = safeDivide(currentCash, deficit);
          monthsSurviving = roundTo(m - 1 + fractionalMonth, 1);
          break;
        }
      }
    }

    if (monthsSurviving >= maxHorizon) {
      simulatedRunways[sim] = maxHorizon;
    } else {
      simulatedRunways[sim] = monthsSurviving;
    }
  }

  // Sort ascending to calculate true empirical percentiles
  simulatedRunways.sort((a, b) => a - b);

  const p10Index = Math.floor(numSims * 0.10);
  const p50Index = Math.floor(numSims * 0.50);
  const p90Index = Math.floor(numSims * 0.90);

  const p10 = roundTo(simulatedRunways[Math.min(numSims - 1, p10Index)], 1);
  const p50 = roundTo(simulatedRunways[Math.min(numSims - 1, p50Index)], 1);
  const p90 = roundTo(simulatedRunways[Math.min(numSims - 1, p90Index)], 1);

  const worstCase = roundTo(simulatedRunways[0], 1);
  const bestCase = roundTo(simulatedRunways[numSims - 1], 1);

  const surviving12mCount = simulatedRunways.filter((r) => r >= 12).length;
  const probabilityOfSurvival12Months = roundTo(
    (surviving12mCount / numSims) * 100,
    1
  );

  // Standard 6-bin histogram across the full [0, maxHorizon] horizon
  const binStep = Math.max(1, Math.round(maxHorizon / 6));
  const bins: { binStart: number; binEnd: number; count: number; percentage: number }[] = [];

  for (let b = 0; b < maxHorizon; b += binStep) {
    const end = Math.min(maxHorizon + (b + binStep >= maxHorizon ? 1 : 0), b + binStep);
    const count = simulatedRunways.filter((r) => r >= b && (end > maxHorizon ? r <= maxHorizon : r < end)).length;
    bins.push({
      binStart: b,
      binEnd: end > maxHorizon ? maxHorizon : end,
      count,
      percentage: roundTo((count / numSims) * 100, 1),
    });
  }

  return {
    simulationsCount: numSims,
    seedUsed: seed,
    percentiles: { p10, p50, p90 },
    distribution: bins,
    worstCaseRunway: worstCase,
    bestCaseRunway: bestCase,
    probabilityOfSurvival12Months,
    underlyingShockAssumptions: [
      `1,000 independent trials generated using Mulberry32 PRNG (seed=${seed}).`,
      `Revenue stochastic volatility: ±${roundTo(revVol * 100, 0)}% normal standard deviation.`,
      `Operating expense drift: ±${roundTo(expVol * 100, 0)}% normal standard deviation.`,
      `Active Macro Shock Multiplier: ${roundTo(shockFactor, 2)}x applied to baseline burn.`,
    ],
  };
}
