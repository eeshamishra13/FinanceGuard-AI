export interface FinancialProfile {
  income: number;
  otherIncome: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  emergencyFund: number;
  savings: number;
  investments: number;
  debt: number;
  monthlyDebtPayment: number;
}

export interface DerivedMetrics {
  totalExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  monthlyBurn: number;
  netWorth: number;
  runwayMonths: number;
  resilienceScore: number;
  resilienceBand: "critical" | "warning" | "healthy";
  resilienceBreakdown: {
    emergencyFund: number;
    savingsRate: number;
    debtBurden: number;
    expenseStability: number;
    incomeStability: number;
  };
}

export interface ForecastPoint {
  month: number;
  netWorth: number;
  runway: number;
  resilience: number;
}

export interface SimulationScenario {
  incomeChangePercent?: number;
  durationMonths?: number;
  rentChangePercent?: number;
  emiChangePercent?: number;
  unexpectedExpense?: number;
  discretionaryReductionAmount?: number;
  savingsBoostAmount?: number;
}

export interface SimulationResult {
  baseline: DerivedMetrics;
  scenario: DerivedMetrics;
  delta: {
    resilience: number;
    runway: number;
    monthlySavings: number;
  };
  monthlyProjection: {
    baseline: ForecastPoint[];
    scenario: ForecastPoint[];
  };
  narrative: {
    cause: string;
    topFactors: string[];
  };
}
