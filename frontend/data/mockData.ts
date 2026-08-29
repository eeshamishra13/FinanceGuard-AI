import type { CashFlowPoint, DerivedMetrics, FinancialProfile, ForecastPoint } from "@/types";

export const mockMetrics: DerivedMetrics = {
  totalExpenses: 42000,
  monthlySavings: 23000,
  savingsRate: 35.4,
  monthlyBurn: 37000,
  netWorth: 600000,
  runwayMonths: 10.8,
  resilienceScore: 82,
  resilienceBand: "healthy",
  resilienceBreakdown: {
    emergencyFund: 28,
    savingsRate: 22,
    debtBurden: 16,
    expenseStability: 13,
    incomeStability: 3,
  },
};

export const mockProfile: FinancialProfile = {
  income: 65000,
  otherIncome: 0,
  essentialExpenses: 32000,
  discretionaryExpenses: 10000,
  emergencyFund: 400000,
  savings: 150000,
  investments: 100000,
  debt: 50000,
  monthlyDebtPayment: 5000,
};

export const mockForecast: ForecastPoint[] = [
  { month: 0, netWorth: 600000, runway: 10.8, resilience: 82 },
  { month: 1, netWorth: 621000, runway: 11.1, resilience: 83 },
  { month: 2, netWorth: 643500, runway: 11.5, resilience: 84 },
  { month: 3, netWorth: 662000, runway: 11.8, resilience: 85 },
  { month: 4, netWorth: 688500, runway: 12.2, resilience: 87 },
  { month: 5, netWorth: 715000, runway: 12.6, resilience: 88 },
];

export const mockCashFlow: CashFlowPoint[] = [
  { month: "JAN", income: 65000, expenses: 39000 },
  { month: "FEB", income: 65000, expenses: 41000 },
  { month: "MAR", income: 67000, expenses: 43000 },
  { month: "APR", income: 65000, expenses: 40000 },
  { month: "MAY", income: 68000, expenses: 45000 },
  { month: "JUN", income: 65000, expenses: 42000 },
];
