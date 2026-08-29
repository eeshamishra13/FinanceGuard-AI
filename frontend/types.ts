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

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  detail?: string;
}

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}

export interface MetricLabelProps {
  children: React.ReactNode;
  className?: string;
}

export interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export interface ResilienceRingProps {
  score: number;
  band: DerivedMetrics["resilienceBand"];
}

export interface RunwayGaugeProps {
  months: number;
  max?: number;
}
