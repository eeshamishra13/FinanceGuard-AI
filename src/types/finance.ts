export interface FinancialMetrics {
  resilience: number;
  runwayMonths: number;
  monthlySavings: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  liquidEmergencyFund: number;
  investments: number;
  fixedExpenses: number;
  discretionaryExpenses: number;
}

export type ScenarioType = 
  | 'job_loss' 
  | 'rent_increase' 
  | 'emergency_expense' 
  | 'income_boost' 
  | 'cut_spending';

export interface TimelineMonth {
  monthIndex: number;
  monthName: string;
  resilience: number;
  runwayMonths: number;
  netWorth: number;
  monthlySavings: number;
  status: 'safe' | 'warning' | 'critical';
  notes: string;
}

export interface RecoveryLever {
  id: string;
  title: string;
  description: string;
  monthlyImpact: number;
  lumpSumImpact: number;
  resilienceBoost: number;
  actionType: 'expense_cut' | 'emergency_fund' | 'side_income' | 'debt_optimization';
  applied: boolean;
}

export interface ProjectionPoint {
  month: string;
  baselineNetWorth: number;
  stressedNetWorth: number;
  baselineRunway: number;
  stressedRunway: number;
  baselineResilience: number;
  stressedResilience: number;
}

export interface TopFactor {
  factor: string;
  impact: string;
  isNegative: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface StressTestResult {
  scenarioType: ScenarioType;
  scenarioTitle: string;
  scenarioDescription: string;
  params: Record<string, any>;
  before: FinancialMetrics;
  after: FinancialMetrics;
  verdict: string;
  verdictSeverity: 'safe' | 'warning' | 'critical';
  topFactors: TopFactor[];
  timeline: TimelineMonth[];
  projections: ProjectionPoint[];
  recoveryLevers: RecoveryLever[];
  appliedLeverIds: string[];
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  diagnosisBadge?: {
    label: string;
    variant: 'safe' | 'warning' | 'critical' | 'info';
  };
  metricsHighlight?: {
    label: string;
    value: string;
    change?: string;
    positive?: boolean;
  }[];
  actionSteps?: string[];
  suggestedFollowUps?: string[];
}
