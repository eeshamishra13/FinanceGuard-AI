import type { FinancialTwinCore, SensitivityTornadoItem } from "./twinTypes.ts";
import { calculateWaterfall } from "./waterfall.ts";
import { roundTo } from "./engine.ts";

export interface SensitivityScenarioParam {
  key: string;
  label: string;
  category: SensitivityTornadoItem["primaryCategory"];
  applyNegativeShock: (twin: FinancialTwinCore) => FinancialTwinCore;
  applyPositiveShock: (twin: FinancialTwinCore) => FinancialTwinCore;
}

export const STANDARD_SENSITIVITY_VECTORS: SensitivityScenarioParam[] = [
  {
    key: "fuel_price",
    label: "Fuel / Diesel Price (±20%)",
    category: "Fuel",
    applyNegativeShock: (twin) => {
      const fuelExposure = twin.exposures.find((e) => e.category === "Fuel");
      const beta = fuelExposure?.beta ?? 0.32;
      const baseSpend = fuelExposure?.baselineMonthlySpend ?? twin.mandatoryExpenses * 0.25;
      const deltaBurn = baseSpend * 0.20 * beta;
      return {
        ...twin,
        mandatoryExpenses: twin.mandatoryExpenses + deltaBurn,
        totalMonthlyBurn: twin.totalMonthlyBurn + deltaBurn,
      };
    },
    applyPositiveShock: (twin) => {
      const fuelExposure = twin.exposures.find((e) => e.category === "Fuel");
      const beta = fuelExposure?.beta ?? 0.32;
      const baseSpend = fuelExposure?.baselineMonthlySpend ?? twin.mandatoryExpenses * 0.25;
      const deltaBurn = baseSpend * 0.20 * beta;
      return {
        ...twin,
        mandatoryExpenses: Math.max(0, twin.mandatoryExpenses - deltaBurn),
        totalMonthlyBurn: Math.max(0, twin.totalMonthlyBurn - deltaBurn),
      };
    },
  },
  {
    key: "revenue_contraction",
    label: "Client Demand / Inflow (±15%)",
    category: "Revenue",
    applyNegativeShock: (twin) => ({
      ...twin,
      monthlyInflow: Math.max(0, twin.monthlyInflow * 0.85),
    }),
    applyPositiveShock: (twin) => ({
      ...twin,
      monthlyInflow: twin.monthlyInflow * 1.15,
    }),
  },
  {
    key: "interest_rate",
    label: "Debt Service / Repo Rate (±200 bps)",
    category: "Debt Service",
    applyNegativeShock: (twin) => {
      const deltaDebt = twin.monthlyDebtService * 0.18;
      return {
        ...twin,
        mandatoryExpenses: twin.mandatoryExpenses + deltaDebt,
        totalMonthlyBurn: twin.totalMonthlyBurn + deltaDebt,
        monthlyDebtService: twin.monthlyDebtService + deltaDebt,
      };
    },
    applyPositiveShock: (twin) => {
      const deltaDebt = twin.monthlyDebtService * 0.18;
      return {
        ...twin,
        mandatoryExpenses: Math.max(0, twin.mandatoryExpenses - deltaDebt),
        totalMonthlyBurn: Math.max(0, twin.totalMonthlyBurn - deltaDebt),
        monthlyDebtService: Math.max(0, twin.monthlyDebtService - deltaDebt),
      };
    },
  },
  {
    key: "receivables_delay",
    label: "Customer Payment Delay (30 Days)",
    category: "Logistics",
    applyNegativeShock: (twin) => ({
      ...twin,
      totalLiquidCash: Math.max(0, twin.totalLiquidCash - twin.accountsReceivable * 0.35),
      accountsPayable: twin.accountsPayable * 1.15,
    }),
    applyPositiveShock: (twin) => ({
      ...twin,
      totalLiquidCash: twin.totalLiquidCash + twin.accountsReceivable * 0.35,
      accountsPayable: Math.max(0, twin.accountsPayable * 0.85),
    }),
  },
  {
    key: "discretionary_opex",
    label: "Discretionary Overheads (±25%)",
    category: "Discretionary",
    applyNegativeShock: (twin) => ({
      ...twin,
      discretionaryExpenses: twin.discretionaryExpenses * 1.25,
      totalMonthlyBurn: twin.totalMonthlyBurn + twin.discretionaryExpenses * 0.25,
    }),
    applyPositiveShock: (twin) => ({
      ...twin,
      discretionaryExpenses: Math.max(0, twin.discretionaryExpenses * 0.75),
      totalMonthlyBurn: Math.max(0, twin.totalMonthlyBurn - twin.discretionaryExpenses * 0.25),
    }),
  },
];

/**
 * Computes parametric Tornado sensitivity rankings across key operational variables.
 */
export function generateSensitivityTornado(
  twin: FinancialTwinCore,
  vectors: SensitivityScenarioParam[] = STANDARD_SENSITIVITY_VECTORS
): SensitivityTornadoItem[] {
  const baseWaterfall = calculateWaterfall(twin);
  const baseRunway = baseWaterfall.summary.effectiveRunwayMonths;

  const results: SensitivityTornadoItem[] = [];

  for (const v of vectors) {
    const negTwin = v.applyNegativeShock(twin);
    const negWaterfall = calculateWaterfall(negTwin);
    const negRunway = negWaterfall.summary.effectiveRunwayMonths;

    const posTwin = v.applyPositiveShock(twin);
    const posWaterfall = calculateWaterfall(posTwin);
    const posRunway = posWaterfall.summary.effectiveRunwayMonths;

    const swingMonths = roundTo(Math.abs(posRunway - negRunway), 1);

    results.push({
      variableKey: v.key,
      label: v.label,
      baseRunwayMonths: baseRunway,
      negativeShockRunway: negRunway,
      positiveShockRunway: posRunway,
      swingMonths,
      vulnerabilityRank: 0, // Assigned below
      primaryCategory: v.category,
    });
  }

  // Sort descending by swing impact
  results.sort((a, b) => b.swingMonths - a.swingMonths);

  // Assign ranks
  results.forEach((item, idx) => {
    item.vulnerabilityRank = idx + 1;
  });

  return results;
}
