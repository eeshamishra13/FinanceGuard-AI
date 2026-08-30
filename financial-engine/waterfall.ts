import type { FinancialTwinCore, WaterfallTiers, OrganizationSettings } from "./twinTypes.ts";
import { validateOrganizationSettings } from "./twinTypes.ts";
import { roundTo, safeDivide } from "./engine.ts";

export interface WaterfallOptions {
  emergencyBufferMonths?: number;
  workingCapitalSafetyMarginMonths?: number;
}

/**
 * Calculates the 4-Tier Liquidity Waterfall with strict semantic separation
 * between Business (Working Capital) and Personal (Near-Term Obligations) modes.
 * Accepts optional OrganizationSettings or WaterfallOptions to override target buffer months.
 */
export function calculateWaterfall(
  twin: FinancialTwinCore,
  options?: WaterfallOptions | OrganizationSettings
): WaterfallTiers {
  if (options) {
    validateOrganizationSettings(options as Partial<OrganizationSettings>);
  }

  const isBusiness = twin.twinType === "business";
  const defaultBufferMonths = isBusiness ? 3 : 6;
  const bufferMonths = options?.emergencyBufferMonths ?? defaultBufferMonths;
  const safetyMonths = (options && "workingCapitalSafetyMarginMonths" in options && options.workingCapitalSafetyMarginMonths)
    ? options.workingCapitalSafetyMarginMonths
    : 0.5;

  // Total unencumbered cash available to flow through the waterfall
  const totalCash = Math.max(0, twin.totalLiquidCash);
  let remainingCash = totalCash;

  // -------------------------------------------------------------
  // TIER 1: Operating Liquidity / Mandatory Requirements
  // -------------------------------------------------------------
  const tier1Required = roundTo(twin.mandatoryExpenses, 0);
  const tier1Allocated = Math.min(remainingCash, tier1Required);
  remainingCash = Math.max(0, remainingCash - tier1Allocated);

  const tier1Coverage = tier1Required > 0 ? safeDivide(tier1Allocated, tier1Required) : 1;

  // -------------------------------------------------------------
  // TIER 2: Emergency Reserve Buffer
  // -------------------------------------------------------------
  const tier2Required = roundTo(twin.mandatoryExpenses * bufferMonths, 0);
  const tier2Allocated = Math.min(remainingCash, tier2Required);
  remainingCash = Math.max(0, remainingCash - tier2Allocated);
  const tier2Deficit = roundTo(Math.max(0, tier2Required - tier2Allocated), 0);

  // -------------------------------------------------------------
  // TIER 3: Working Capital (Business) vs. Near-Term Obligations (Personal)
  // -------------------------------------------------------------
  let tier3Required = 0;
  let tier3Name = "";
  let tier3Description = "";

  if (isBusiness) {
    tier3Name = "Working Capital Cushion";
    // Business formula: max(0, AP - AR) + SafetyMargin
    const workingCapitalGap = Math.max(0, twin.accountsPayable - twin.accountsReceivable);
    const operatingSafetyMargin = roundTo(twin.mandatoryExpenses * safetyMonths, 0);
    tier3Required = roundTo(workingCapitalGap + operatingSafetyMargin, 0);
    tier3Description = `Buffer for net payables exposure (₹${workingCapitalGap.toLocaleString("en-IN")}) plus ${safetyMonths * 30} days operating liquidity margin.`;
  } else {
    tier3Name = "Near-Term Obligations Cushion";
    // Personal formula: committed near-term dues + safety margin
    const safetyMargin = roundTo(twin.mandatoryExpenses * safetyMonths, 0);
    tier3Required = roundTo(twin.committedNearTermObligations + safetyMargin, 0);
    tier3Description = `Buffer for upcoming committed dues (₹${twin.committedNearTermObligations.toLocaleString("en-IN")}) plus near-term expense cushion.`;
  }

  const tier3Allocated = Math.min(remainingCash, tier3Required);
  remainingCash = Math.max(0, remainingCash - tier3Allocated);

  // -------------------------------------------------------------
  // TIER 4: Deployable Surplus (Guaranteed non-negative)
  // -------------------------------------------------------------
  const tier4Amount = roundTo(remainingCash, 0);
  const totalProtected = roundTo(tier1Allocated + tier2Allocated + tier3Allocated, 0);

  // Health Band & Effective Runway
  const effectiveRunwayMonths = roundTo(safeDivide(totalCash, Math.max(1, twin.totalMonthlyBurn)), 1);

  let healthBand: "critical" | "warning" | "healthy" = "healthy";
  if (effectiveRunwayMonths < 2 || tier1Allocated < tier1Required) {
    healthBand = "critical";
  } else if (effectiveRunwayMonths < (isBusiness ? 3 : 6) || tier2Deficit > 0) {
    healthBand = "warning";
  }

  return {
    tier1_operational: {
      name: isBusiness ? "Tier 1: Mandatory Operating Liquidity" : "Tier 1: Essential Living Liquidity",
      amountRequired: tier1Required,
      amountAllocated: tier1Allocated,
      isFullyFunded: tier1Allocated >= tier1Required,
      coverageMonths: roundTo(tier1Coverage, 2),
      description: isBusiness
        ? "Non-negotiable payroll, fixed facilities, and immediate debt service for the current operating cycle."
        : "Mandatory rent, food, essential bills, and loan EMIs for the current monthly cycle.",
    },
    tier2_emergencyBuffer: {
      name: "Tier 2: Emergency Resilience Reserve",
      targetMonths: bufferMonths,
      amountRequired: tier2Required,
      amountAllocated: tier2Allocated,
      isFullyFunded: tier2Allocated >= tier2Required,
      deficit: tier2Deficit,
      description: `Shields against sudden revenue drops or unexpected shocks (${bufferMonths} months burn target).`,
    },
    tier3_workingCapitalOrObligations: {
      name: tier3Name,
      amountRequired: tier3Required,
      amountAllocated: tier3Allocated,
      isFullyFunded: tier3Allocated >= tier3Required,
      description: tier3Description,
    },
    tier4_deployableSurplus: {
      name: "Tier 4: Strategic Deployable Surplus",
      amount: tier4Amount,
      isAvailable: tier4Amount > 0,
      description: "True unencumbered surplus capital safely deployable into growth investments or yield expansion.",
    },
    summary: {
      totalLiquidCash: totalCash,
      totalProtected,
      freeSurplus: tier4Amount,
      effectiveRunwayMonths,
      healthBand,
    },
  };
}
