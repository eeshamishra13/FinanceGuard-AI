export interface CurrentFinancialState {
  income: number; // e.g. 60000
  expenses: number; // e.g. 42000
  savings: number; // e.g. 18000
  netWorth: number; // e.g. 380000
  savingsRate: number; // e.g. 30 (percent)
  runwayMonths: number; // e.g. 7.2
  resilienceScore: number; // e.g. 82 (out of 100)
}

export interface SimulationAfterState {
  resilienceScore: number;
  runwayMonths: number;
  projectedBalance: number;
  monthlyCashFlow: number;
}

export type ScenarioId = 
  | 'jobloss' 
  | 'income_minus_30' 
  | 'rent_plus_20' 
  | 'emergency_expense' 
  | 'save_more';

export interface TimelinePoint {
  monthIndex: number;
  monthName: string;
  balance: number;
  resilience: number;
  runway: number;
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
  applied: boolean;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  shortDesc: string;
  tag: string;
  iconName: string;
  after: SimulationAfterState;
  aiExplanation: string;
  concreteRecommendation: string;
  topFactors: {
    factor: string;
    impact: string;
    isNegative: boolean;
  }[];
  timeline: TimelinePoint[];
  recoveryLevers: RecoveryLever[];
}

export interface FullSimulationData {
  current: CurrentFinancialState;
  simulation: {
    scenario: ScenarioId;
    after: SimulationAfterState;
    aiExplanation: string;
  };
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