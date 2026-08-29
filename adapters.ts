import type {
  BusinessProfile,
  ExposureVector,
  FinancialTwinCore,
  PersonalProfileInput,
} from "./twinTypes.ts";
import type { FinancialProfile } from "./types.ts";
import { roundTo } from "./engine.ts";

/**
 * Maps a business profile and operational exposures into the universal FinancialTwinCore schema.
 */
export function createBusinessTwin(
  profile: BusinessProfile,
  customExposures?: ExposureVector[]
): FinancialTwinCore {
  const mandatoryExpenses = roundTo(profile.fixedOpEx + profile.debtService, 0);
  const totalBurn = roundTo(profile.fixedOpEx + profile.variableOpEx + profile.debtService, 0);
  const netCashflow = roundTo(profile.monthlyRevenue - totalBurn, 0);
  const nearTermObligations = Math.max(0, profile.accountsPayable - profile.accountsReceivable);

  const defaultExposures: ExposureVector[] = customExposures ?? [
    {
      signalKey: "diesel",
      category: "Fuel",
      beta: 0.32,
      confidence: "medium",
      method: "shrinkage",
      baselineMonthlySpend: profile.fuelSpend || roundTo(profile.fixedOpEx * 0.25, 0),
      description: "Fleet diesel & freight delivery sensitivity",
    },
    {
      signalKey: "interest_rate",
      category: "Debt Service",
      beta: 0.35,
      confidence: "high",
      method: "regression",
      baselineMonthlySpend: profile.debtService,
      description: "Floating working capital credit line & equipment financing",
    },
    {
      signalKey: "usd_inr",
      category: "Logistics",
      beta: 0.22,
      confidence: "medium",
      method: "shrinkage",
      baselineMonthlySpend: roundTo(profile.fixedOpEx * 0.15, 0),
      description: "Cross-border component & spare parts pricing",
    },
  ];

  return {
    id: `twin_biz_${Date.now()}`,
    twinType: "business",
    entityName: profile.companyName,
    industryOrRole: profile.industry,
    monthlyInflow: roundTo(profile.monthlyRevenue, 0),
    mandatoryExpenses,
    discretionaryExpenses: roundTo(profile.variableOpEx, 0),
    totalMonthlyBurn: totalBurn,
    netMonthlyCashflow: netCashflow,
    totalLiquidCash: roundTo(profile.cashBalance, 0),
    totalDebt: roundTo(profile.totalDebt, 0),
    monthlyDebtService: roundTo(profile.debtService, 0),
    accountsReceivable: roundTo(profile.accountsReceivable, 0),
    accountsPayable: roundTo(profile.accountsPayable, 0),
    committedNearTermObligations: roundTo(nearTermObligations, 0),
    exposures: defaultExposures,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Maps a consumer / personal financial profile into the universal FinancialTwinCore schema.
 */
export function createPersonalTwin(
  profile: PersonalProfileInput | FinancialProfile,
  customExposures?: ExposureVector[]
): FinancialTwinCore {
  const isPersonalInput = "monthlyIncome" in profile;
  const totalInflow = isPersonalInput
    ? roundTo(profile.monthlyIncome + (profile.otherIncome || 0), 0)
    : roundTo(profile.income + (profile.otherIncome || 0), 0);

  const essential = profile.essentialExpenses;
  const discretionary = profile.discretionaryExpenses;
  const debtPayment = isPersonalInput ? profile.monthlyDebtPayment : profile.monthlyDebtPayment;
  const debt = isPersonalInput ? profile.totalDebt : profile.debt;

  let liquidCash = 0;
  if (isPersonalInput && typeof profile.liquidCash === "number") {
    liquidCash = profile.liquidCash;
  } else if ("emergencyFund" in profile && "savings" in profile) {
    liquidCash = profile.emergencyFund + profile.savings;
  }

  const mandatory = roundTo(essential + debtPayment, 0);
  const totalBurn = roundTo(essential + discretionary + debtPayment, 0);
  const netCashflow = roundTo(totalInflow - totalBurn, 0);

  const committedNearTerm = isPersonalInput
    ? profile.committedObligationsNearTerm
    : roundTo(debtPayment + essential * 0.2, 0);

  const defaultExposures: ExposureVector[] = customExposures ?? [
    {
      signalKey: "fuel",
      category: "Fuel",
      beta: 0.18,
      confidence: "medium",
      method: "shrinkage",
      baselineMonthlySpend: roundTo(essential * 0.12, 0),
      description: "Commute & personal transport fuel sensitivity",
    },
    {
      signalKey: "inflation",
      category: "Food",
      beta: 0.25,
      confidence: "low",
      method: "prior",
      baselineMonthlySpend: roundTo(essential * 0.35, 0),
      description: "Household groceries & utilities inflation exposure",
    },
    {
      signalKey: "interest_rate",
      category: "Debt Service",
      beta: 0.30,
      confidence: "high",
      method: "regression",
      baselineMonthlySpend: debtPayment,
      description: "Home & auto loan floating interest exposure",
    },
  ];

  return {
    id: `twin_pers_${Date.now()}`,
    twinType: "personal",
    entityName: isPersonalInput && profile.name ? profile.name : "Personal Digital Twin",
    industryOrRole: "Individual / Household",
    monthlyInflow: totalInflow,
    mandatoryExpenses: mandatory,
    discretionaryExpenses: roundTo(discretionary, 0),
    totalMonthlyBurn: totalBurn,
    netMonthlyCashflow: netCashflow,
    totalLiquidCash: roundTo(liquidCash, 0),
    totalDebt: roundTo(debt || 0, 0),
    monthlyDebtService: roundTo(debtPayment, 0),
    accountsReceivable: 0,
    accountsPayable: 0,
    committedNearTermObligations: roundTo(committedNearTerm, 0),
    exposures: defaultExposures,
    lastUpdated: new Date().toISOString(),
  };
}
