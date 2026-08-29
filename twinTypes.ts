/**
 * Universal Financial Twin Schema & Domain Contracts
 * 
 * Unifies Business and Personal modes through dedicated Adapters into a
 * single canonical Twin representation used by the Exposure, Waterfall,
 * Monte Carlo, Sensitivity, and Decision engines.
 */

export type TwinType = "business" | "personal";

export type ConfidenceLevel = "low" | "medium" | "high";

export type EstimationMethod = "prior" | "shrinkage" | "regression";

export type TransactionType = "credit" | "debit";

export type TransactionCategory =
  | "Revenue"
  | "Payroll"
  | "Fuel"
  | "Rent"
  | "Utilities"
  | "Inventory"
  | "Tax"
  | "Debt Service"
  | "Logistics"
  | "Food"
  | "Transport"
  | "Healthcare"
  | "Discretionary"
  | "Other";

export interface Transaction {
  id: string;
  twinId: string;
  date: string; // YYYY-MM-DD
  descriptionRaw: string;
  descriptionNormalized: string;
  amount: number;
  type: TransactionType;
  merchant?: string;
  category: TransactionCategory;
  isRecurring: boolean;
  confidence: ConfidenceLevel;
}

export interface EconomicSignal {
  key: string;
  name: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  updatedAt: string;
}

export interface ExposureVector {
  signalKey: string;
  category: TransactionCategory;
  beta: number; // Sensitivity coefficient
  confidence: ConfidenceLevel;
  method: EstimationMethod;
  baselineMonthlySpend: number;
  description: string;
}

export interface BusinessProfile {
  companyName: string;
  industry: string;
  monthlyRevenue: number;
  fixedOpEx: number;
  variableOpEx: number;
  payroll: number;
  fuelSpend: number;
  debtService: number;
  totalDebt: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventoryValue?: number;
  exposureCategories: string[];
}

export interface PersonalProfileInput {
  name?: string;
  monthlyIncome: number;
  otherIncome: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  monthlyDebtPayment: number;
  totalDebt: number;
  liquidCash: number;
  emergencyFund: number;
  savings: number;
  investments: number;
  committedObligationsNearTerm: number;
}

export interface FinancialTwinCore {
  id: string;
  twinType: TwinType;
  entityName: string;
  industryOrRole: string;
  
  // Inflow & Outflows
  monthlyInflow: number;
  mandatoryExpenses: number;    // Business: Fixed OpEx + Debt | Personal: Essential + EMI
  discretionaryExpenses: number;// Business: Variable non-critical | Personal: Discretionary
  totalMonthlyBurn: number;     // Mandatory expenses + debt service
  netMonthlyCashflow: number;   // Monthly Inflow - All Expenses
  
  // Balance Sheet & Working Buffer
  totalLiquidCash: number;      // Available checking/unencumbered cash
  totalDebt: number;
  monthlyDebtService: number;
  
  // Domain Specific Working Capital / Near-term Obligations
  accountsReceivable: number;   // Business AR (Personal: 0)
  accountsPayable: number;      // Business AP (Personal: 0)
  committedNearTermObligations: number; // Business: max(0, AP - AR) | Personal: committed near-term dues
  
  // Exposure model
  exposures: ExposureVector[];
  
  // Meta
  lastUpdated: string;
}

export interface WaterfallTiers {
  tier1_operational: {
    name: string;
    amountRequired: number;
    amountAllocated: number;
    isFullyFunded: boolean;
    coverageMonths: number;
    description: string;
  };
  tier2_emergencyBuffer: {
    name: string;
    targetMonths: number;
    amountRequired: number;
    amountAllocated: number;
    isFullyFunded: boolean;
    deficit: number;
    description: string;
  };
  tier3_workingCapitalOrObligations: {
    name: string; // Business: "Working Capital Cushion" | Personal: "Near-Term Obligations Cushion"
    amountRequired: number;
    amountAllocated: number;
    isFullyFunded: boolean;
    description: string;
  };
  tier4_deployableSurplus: {
    name: string;
    amount: number; // strictly >= 0
    isAvailable: boolean;
    description: string;
  };
  summary: {
    totalLiquidCash: number;
    totalProtected: number; // Tier 1 + Tier 2 + Tier 3
    freeSurplus: number;    // Tier 4
    effectiveRunwayMonths: number;
    healthBand: "critical" | "warning" | "healthy";
  };
}

export interface ExposureImpactResult {
  signalKey: string;
  signalName: string;
  originalValue: number;
  shockedValue: number;
  percentageChange: number; // e.g. +25%
  beta: number;
  confidence: ConfidenceLevel;
  method: EstimationMethod;
  baselineMonthlySpend: number;
  deltaMonthlyCost: number; // β * percentageChange * baselineMonthlySpend
  revisedMonthlyCost: number;
}

export interface MonteCarloRunwayResult {
  simulationsCount: number; // exactly 1,000
  seedUsed: number;
  percentiles: {
    p10: number; // Downside scenario runway (months)
    p50: number; // Median scenario runway (months)
    p90: number; // Favorable scenario runway (months)
  };
  distribution: {
    binStart: number;
    binEnd: number;
    count: number;
    percentage: number;
  }[];
  worstCaseRunway: number;
  bestCaseRunway: number;
  probabilityOfSurvival12Months: number; // 0 - 100%
  underlyingShockAssumptions: string[];
}

export interface SensitivityTornadoItem {
  variableKey: string;
  label: string;
  baseRunwayMonths: number;
  negativeShockRunway: number; // e.g. Fuel +20% or Revenue -20%
  positiveShockRunway: number; // e.g. Fuel -20% or Revenue +20%
  swingMonths: number;         // |positive - negative|
  vulnerabilityRank: number;
  primaryCategory: TransactionCategory;
}

export interface DecisionAction {
  id: string;
  title: string;
  actionType: "protect_reserve" | "preserve_working_capital" | "trim_discretionary" | "accelerate_receivables" | "deploy_surplus" | "maintain_course";
  amount: number;
  targetTier: "tier1" | "tier2" | "tier3" | "tier4" | "operational";
  expectedImpact: string;
  resilienceScoreDelta: number;
  projectedRunwayAfterAction: number;
  constraintsChecked: {
    tier1Covered: boolean;
    tier2Preserved: boolean;
    tier3Preserved: boolean;
    noNegativeSurplus: boolean;
  };
  mathematicalReason: string;
  priority: "high" | "medium" | "low";
}

export interface DecisionOptimizationResult {
  objective: string;
  baselineRunwayMonths: number;
  optimizedRunwayMonths: number;
  recommendedActions: DecisionAction[];
  primaryAction: DecisionAction;
  postActionWaterfall: WaterfallTiers;
  constraintsSatisfied: boolean;
}
