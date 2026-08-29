const fs = require('fs');
const path = require('path');

function write(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created:', relPath);
}

// 1. src/types/finance.ts
write('src/types/finance.ts', `
export interface FinancialMetrics {
  resilience: number; // 0 to 100
  runwayMonths: number; // in months, e.g. 10.8
  monthlySavings: number; // in INR, e.g. 23000
  netWorth: number; // in INR, e.g. 600000
  monthlyIncome: number; // in INR, e.g. 105000
  monthlyExpenses: number; // in INR, e.g. 82000
  liquidEmergencyFund: number; // in INR, e.g. 250000
  investments: number; // in INR, e.g. 350000
  fixedExpenses: number; // in INR, e.g. 52000
  discretionaryExpenses: number; // in INR, e.g. 30000
}

export type ScenarioType = 
  | 'job_loss' 
  | 'rent_increase' 
  | 'emergency_expense' 
  | 'income_boost' 
  | 'cut_spending';

export interface JobLossParams {
  incomeDropPercent: number; // 0 - 100%
  durationMonths: number; // 1 - 12
  severancePay: number; // in INR
}

export interface RentIncreaseParams {
  rentIncreaseAmount: number; // in INR
}

export interface EmergencyExpenseParams {
  expenseAmount: number; // in INR
  category: string;
}

export interface IncomeBoostParams {
  additionalIncome: number; // in INR
  durationMonths: number;
}

export interface CutSpendingParams {
  monthlyCutAmount: number; // in INR
  targetCategory: string;
}

export type ScenarioParams = 
  | JobLossParams 
  | RentIncreaseParams 
  | EmergencyExpenseParams 
  | IncomeBoostParams 
  | CutSpendingParams;

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
  monthlyImpact: number; // positive = monthly savings added
  lumpSumImpact: number; // positive = cash added to reserves
  resilienceBoost: number; // estimated resilience score gain
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
`);

console.log('Step 1 complete: types');
// 2. src/lib/simulatorService.ts
write('src/lib/simulatorService.ts', `
import { 
  FinancialMetrics, 
  ScenarioType, 
  StressTestResult, 
  TimelineMonth, 
  ProjectionPoint, 
  RecoveryLever, 
  TopFactor 
} from '../types/finance';

/**
 * BASELINE FINANCIAL TWIN
 * Represents the fictional user's current baseline state.
 */
export const BASELINE_METRICS: FinancialMetrics = {
  resilience: 82,
  runwayMonths: 10.8,
  monthlySavings: 23000,
  netWorth: 600000,
  monthlyIncome: 105000,
  monthlyExpenses: 82000,
  liquidEmergencyFund: 250000,
  investments: 350000,
  fixedExpenses: 52000,
  discretionaryExpenses: 30000,
};

export interface ScenarioDefinition {
  type: ScenarioType;
  title: string;
  shortDesc: string;
  iconName: string;
  badge: string;
  defaultParams: Record<string, any>;
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    type: 'job_loss',
    title: 'Job Loss',
    shortDesc: 'Temporary or sudden loss of primary salary / client revenue',
    iconName: 'BriefcaseOff',
    badge: 'High Impact',
    defaultParams: {
      incomeDropPercent: 100,
      durationMonths: 4,
      severancePay: 0,
    },
  },
  {
    type: 'rent_increase',
    title: 'Rent Increase',
    shortDesc: 'Unexpected surge in monthly residential lease or landlord escalation',
    iconName: 'Home',
    badge: 'Recurring Cost',
    defaultParams: {
      rentIncreaseAmount: 12000,
    },
  },
  {
    type: 'emergency_expense',
    title: 'Emergency Expense',
    shortDesc: 'Unplanned medical, vehicle, family, or critical appliance expenditure',
    iconName: 'AlertTriangle',
    badge: 'Lump Sum',
    defaultParams: {
      expenseAmount: 150000,
      category: 'Medical / Home Repair',
    },
  },
  {
    type: 'income_boost',
    title: 'Income Boost',
    shortDesc: 'Promotion, salary hike, freelance retainer, or annual incentive',
    iconName: 'TrendingUp',
    badge: 'Positive Growth',
    defaultParams: {
      additionalIncome: 25000,
      durationMonths: 6,
    },
  },
  {
    type: 'cut_spending',
    title: 'Cut Discretionary Spending',
    shortDesc: 'Aggressive optimization of lifestyle, dining out, and subscriptions',
    iconName: 'Scissors',
    badge: 'Optimization',
    defaultParams: {
      monthlyCutAmount: 10000,
      targetCategory: 'Dining & Entertainment',
    },
  },
];

/**
 * Pure calculation function for Financial Resilience Score (0-100)
 */
export function calculateResilienceScore(
  monthlyIncome: number,
  monthlyExpenses: number,
  liquidFund: number,
  netWorth: number,
  fixedExpenses: number
): number {
  if (monthlyExpenses <= 0) return 95;

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : -1;
  const runway = liquidFund / monthlyExpenses;
  const fixedRatio = monthlyIncome > 0 ? fixedExpenses / monthlyIncome : 1;

  let score = 50;

  // 1. Savings Rate Component (-25 to +25)
  if (savingsRate >= 0.3) {
    score += 25;
  } else if (savingsRate >= 0.15) {
    score += 18;
  } else if (savingsRate >= 0) {
    score += 8;
  } else if (savingsRate >= -0.5) {
    score -= 18;
  } else {
    score -= 30;
  }

  // 2. Runway Component (0 to +30)
  if (runway >= 12) {
    score += 28;
  } else if (runway >= 6) {
    score += 20 + ((runway - 6) / 6) * 8;
  } else if (runway >= 3) {
    score += 8 + ((runway - 3) / 3) * 12;
  } else if (runway >= 1) {
    score -= 8;
  } else {
    score -= 22;
  }

  // 3. Fixed Expense Load Penalty/Bonus (-15 to +10)
  if (fixedRatio < 0.4 && monthlyIncome > 0) {
    score += 10;
  } else if (fixedRatio > 0.7 || monthlyIncome === 0) {
    score -= 15;
  } else if (fixedRatio > 0.55) {
    score -= 7;
  }

  // 4. Net Worth Cushion Component (0 to +10)
  if (netWorth >= 1000000) {
    score += 10;
  } else if (netWorth >= 500000) {
    score += 6;
  } else if (netWorth >= 200000) {
    score += 3;
  } else if (netWorth < 50000) {
    score -= 5;
  }

  return Math.min(100, Math.max(8, Math.round(score)));
}

/**
 * Returns available recovery levers customized for a given scenario
 */
export function getRecommendedLeversForScenario(
  scenarioType: ScenarioType,
  appliedLeverIds: string[] = []
): RecoveryLever[] {
  let levers: Omit<RecoveryLever, 'applied'>[] = [];

  switch (scenarioType) {
    case 'job_loss':
      levers = [
        {
          id: 'cut_discretionary',
          title: 'Reduce discretionary spending',
          description: 'Pause dining out, luxury shopping, and lifestyle subscriptions.',
          monthlyImpact: 12000,
          lumpSumImpact: 0,
          resilienceBoost: 14,
          actionType: 'expense_cut',
        },
        {
          id: 'emergency_buffer',
          title: 'Liquidate low-yield secondary assets',
          description: 'Reallocate ₹35,000 short-term mutual funds into high-liquidity reserve.',
          monthlyImpact: 0,
          lumpSumImpact: 35000,
          resilienceBoost: 9,
          actionType: 'emergency_fund',
        },
        {
          id: 'freelance_gig',
          title: 'Activate freelance / consulting buffer',
          description: 'Monetize technical skills or advisory for interim bridge cashflow.',
          monthlyImpact: 25000,
          lumpSumImpact: 0,
          resilienceBoost: 16,
          actionType: 'side_income',
        },
      ];
      break;

    case 'rent_increase':
      levers = [
        {
          id: 'cut_subscriptions',
          title: 'Streamline entertainment & utilities',
          description: 'Consolidate multiple streaming plans, gym memberships, and home bills.',
          monthlyImpact: 5000,
          lumpSumImpact: 0,
          resilienceBoost: 8,
          actionType: 'expense_cut',
        },
        {
          id: 'lifestyle_rebalance',
          title: 'Rebalance lifestyle & dining budget',
          description: 'Cap weekend recreation and food delivery to offset rent escalation.',
          monthlyImpact: 7000,
          lumpSumImpact: 0,
          resilienceBoost: 10,
          actionType: 'expense_cut',
        },
        {
          id: 'side_retainer',
          title: 'Pick up weekend consulting gig',
          description: 'Add a flexible ₹10,000/month recurring income stream.',
          monthlyImpact: 10000,
          lumpSumImpact: 0,
          resilienceBoost: 12,
          actionType: 'side_income',
        },
      ];
      break;

    case 'emergency_expense':
      levers = [
        {
          id: 'rebuild_auto_save',
          title: 'Emergency fund auto-rebuild siphon',
          description: 'Auto-transfer discretionary surplus back into liquid reserves.',
          monthlyImpact: 8000,
          lumpSumImpact: 0,
          resilienceBoost: 11,
          actionType: 'emergency_fund',
        },
        {
          id: 'temporary_pause_invest',
          title: 'Pause discretionary SIP for 3 months',
          description: 'Temporarily divert ₹15,000 monthly SIP into immediate cash buffer.',
          monthlyImpact: 15000,
          lumpSumImpact: 0,
          resilienceBoost: 14,
          actionType: 'debt_optimization',
        },
        {
          id: 'claim_insurance_tax',
          title: 'Claim insurance / tax reimbursement',
          description: 'Expedite pending medical or warranty claim payout.',
          monthlyImpact: 0,
          lumpSumImpact: 40000,
          resilienceBoost: 8,
          actionType: 'emergency_fund',
        },
      ];
      break;

    case 'income_boost':
    case 'cut_spending':
    default:
      levers = [
        {
          id: 'boost_emergency_lock',
          title: 'Build 12-month bulletproof emergency vault',
          description: 'Lock ₹20,000 of newly freed cashflow into safe liquid flexi-FD.',
          monthlyImpact: 0,
          lumpSumImpact: 20000,
          resilienceBoost: 6,
          actionType: 'emergency_fund',
        },
        {
          id: 'auto_wealth_compounder',
          title: 'Accelerate index wealth compounding',
          description: 'Channel additional savings into diversified index assets.',
          monthlyImpact: 10000,
          lumpSumImpact: 0,
          resilienceBoost: 8,
          actionType: 'side_income',
        },
      ];
      break;
  }

  return levers.map((lever) => ({
    ...lever,
    applied: appliedLeverIds.includes(lever.id),
  }));
}

/**
 * Deterministic Stress Test Calculation Service
 */
export function runStressTest(
  baseline: FinancialMetrics = BASELINE_METRICS,
  scenarioType: ScenarioType,
  params: Record<string, any>,
  appliedLeverIds: string[] = []
): StressTestResult {
  const definition = SCENARIO_DEFINITIONS.find((s) => s.type === scenarioType) || SCENARIO_DEFINITIONS[0];

  // Base copies
  let stressedIncome = baseline.monthlyIncome;
  let stressedExpenses = baseline.monthlyExpenses;
  let stressedLiquid = baseline.liquidEmergencyFund;
  let stressedNetWorth = baseline.netWorth;
  let stressedFixed = baseline.fixedExpenses;
  let stressedDiscretionary = baseline.discretionaryExpenses;

  // Scenario parameter handling
  let verdict = '';
  let verdictSeverity: 'safe' | 'warning' | 'critical' = 'safe';
  let topFactors: TopFactor[] = [];

  const levers = getRecommendedLeversForScenario(scenarioType, appliedLeverIds);

  // Apply scenario impacts
  switch (scenarioType) {
    case 'job_loss': {
      const dropPct = Number(params.incomeDropPercent ?? 100) / 100;
      const duration = Number(params.durationMonths ?? 4);
      const severance = Number(params.severancePay ?? 0);

      stressedIncome = Math.max(0, baseline.monthlyIncome * (1 - dropPct));
      stressedLiquid = Math.max(0, baseline.liquidEmergencyFund + severance);

      const monthlyDeficit = stressedExpenses - stressedIncome;
      const totalDrawdown = monthlyDeficit * duration;
      stressedNetWorth = Math.max(50000, baseline.netWorth - totalDrawdown + severance);
      
      // Effective immediate liquid calculation
      const effectiveRunway = stressedExpenses > 0 ? Number((stressedLiquid / stressedExpenses).toFixed(1)) : 99;

      if (dropPct >= 0.8 && duration >= 3) {
        verdictSeverity = 'critical';
        verdict = \`Your financial twin enters a critical warning state because the temporary income loss creates an immediate negative monthly cashflow of -₹\${monthlyDeficit.toLocaleString('en-IN')}/mo, rapidly compressing your emergency runway from \${baseline.runwayMonths} months to \${effectiveRunway} months.\`;
      } else {
        verdictSeverity = 'warning';
        verdict = \`Your financial twin experiences moderate stress. Lowered income reduces your monthly savings to -₹\${monthlyDeficit.toLocaleString('en-IN')}, drawing down ₹\${totalDrawdown.toLocaleString('en-IN')} over \${duration} months.\`;
      }

      topFactors = [
        {
          factor: 'Primary Salary Disruption',
          impact: \`-\${(dropPct * 100).toFixed(0)}% Income Loss\`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Monthly Cash Burn',
          impact: \`-₹\${monthlyDeficit.toLocaleString('en-IN')}/month\`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Emergency Runway Compression',
          impact: \`-\${(baseline.runwayMonths - effectiveRunway).toFixed(1)} months\`,
          isNegative: true,
          severity: 'medium',
        },
      ];
      break;
    }

    case 'rent_increase': {
      const rentInc = Number(params.rentIncreaseAmount ?? 12000);
      stressedExpenses = baseline.monthlyExpenses + rentInc;
      stressedFixed = baseline.fixedExpenses + rentInc;
      stressedNetWorth = baseline.netWorth - rentInc * 6;

      const newSavings = stressedIncome - stressedExpenses;
      const newRunway = Number((stressedLiquid / stressedExpenses).toFixed(1));

      if (newSavings < 5000) {
        verdictSeverity = 'critical';
        verdict = \`A ₹\${rentInc.toLocaleString('en-IN')}/mo rent escalation severely erodes your monthly surplus, dropping your savings rate down to ₹\${newSavings.toLocaleString('en-IN')}/mo and increasing fixed cost rigidity.\`;
      } else {
        verdictSeverity = 'warning';
        verdict = \`The rent increase reduces your monthly savings surplus from ₹\${baseline.monthlySavings.toLocaleString('en-IN')} down to ₹\${newSavings.toLocaleString('en-IN')}, moderately diminishing annual wealth accumulation.\`;
      }

      topFactors = [
        {
          factor: 'Fixed Housing Obligation Surge',
          impact: \`+₹\${rentInc.toLocaleString('en-IN')}/month\`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Monthly Savings Shrinkage',
          impact: \`-₹\${rentInc.toLocaleString('en-IN')}/month\`,
          isNegative: true,
          severity: 'medium',
        },
        {
          factor: 'Fixed-to-Income Ratio',
          impact: \`\${((stressedFixed / stressedIncome) * 100).toFixed(0)}% of income\`,
          isNegative: true,
          severity: 'medium',
        },
      ];
      break;
    }

    case 'emergency_expense': {
      const expAmount = Number(params.expenseAmount ?? 150000);
      stressedLiquid = Math.max(10000, baseline.liquidEmergencyFund - expAmount);
      stressedNetWorth = Math.max(50000, baseline.netWorth - expAmount);

      const newRunway = Number((stressedLiquid / stressedExpenses).toFixed(1));

      if (newRunway < 3.0) {
        verdictSeverity = 'critical';
        verdict = \`A sudden ₹\${expAmount.toLocaleString('en-IN')} emergency shock depletes \${((expAmount / baseline.liquidEmergencyFund) * 100).toFixed(0)}% of your liquid safety buffer, leaving only \${newRunway} months of emergency runway.\`;
      } else {
        verdictSeverity = 'warning';
        verdict = \`The ₹\${expAmount.toLocaleString('en-IN')} one-off expense was absorbed by your emergency reserves. While your net worth dropped, your positive monthly cash flow of ₹\${baseline.monthlySavings.toLocaleString('en-IN')} remains intact to rebuild.\`;
      }

      topFactors = [
        {
          factor: 'Liquid Reserve Depletion',
          impact: \`-₹\${expAmount.toLocaleString('en-IN')} cash\`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Runway Reduction',
          impact: \`-\${(baseline.runwayMonths - newRunway).toFixed(1)} months\`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Cash Flow Protection',
          impact: \`₹\${baseline.monthlySavings.toLocaleString('en-IN')}/mo sustained\`,
          isNegative: false,
          severity: 'low',
        },
      ];
      break;
    }

    case 'income_boost': {
      const boost = Number(params.additionalIncome ?? 25000);
      stressedIncome = baseline.monthlyIncome + boost;
      stressedNetWorth = baseline.netWorth + boost * 6;
      stressedLiquid = baseline.liquidEmergencyFund + boost * 3;

      verdictSeverity = 'safe';
      verdict = \`Your financial twin experiences significant positive resilience growth! The ₹\${boost.toLocaleString('en-IN')}/month boost accelerates your monthly savings surplus to ₹\${(baseline.monthlySavings + boost).toLocaleString('en-IN')} and expands emergency runway.\`;

      topFactors = [
        {
          factor: 'Revenue Expansion',
          impact: \`+₹\${boost.toLocaleString('en-IN')}/month\`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Enhanced Savings Rate',
          impact: \`\${(((baseline.monthlySavings + boost) / stressedIncome) * 100).toFixed(0)}% of gross\`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Runway Expansion',
          impact: \`+\${((stressedLiquid / stressedExpenses) - baseline.runwayMonths).toFixed(1)} months\`,
          isNegative: false,
          severity: 'low',
        },
      ];
      break;
    }

    case 'cut_spending': {
      const cut = Number(params.monthlyCutAmount ?? 10000);
      stressedDiscretionary = Math.max(5000, baseline.discretionaryExpenses - cut);
      stressedExpenses = baseline.fixedExpenses + stressedDiscretionary;
      stressedNetWorth = baseline.netWorth + cut * 6;
      stressedLiquid = baseline.liquidEmergencyFund + cut * 3;

      verdictSeverity = 'safe';
      verdict = \`Optimizing discretionary spending frees up ₹\${cut.toLocaleString('en-IN')}/month, expanding your savings rate to ₹\${(baseline.monthlySavings + cut).toLocaleString('en-IN')} and boosting your resilience score.\`;

      topFactors = [
        {
          factor: 'Discretionary Trim',
          impact: \`-₹\${cut.toLocaleString('en-IN')}/month cost\`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Monthly Savings Boost',
          impact: \`+₹\${cut.toLocaleString('en-IN')}/month\`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Runway Cushion',
          impact: \`+\${((stressedLiquid / stressedExpenses) - baseline.runwayMonths).toFixed(1)} months\`,
          isNegative: false,
          severity: 'low',
        },
      ];
      break;
    }
  }

  // Apply active recovery levers
  let totalMonthlyRecovery = 0;
  let totalLumpSumRecovery = 0;
  let totalResilienceBonus = 0;

  for (const lever of levers) {
    if (lever.applied) {
      totalMonthlyRecovery += lever.monthlyImpact;
      totalLumpSumRecovery += lever.lumpSumImpact;
      totalResilienceBonus += lever.resilienceBoost;
    }
  }

  if (totalMonthlyRecovery > 0 || totalLumpSumRecovery > 0) {
    // If levers applied, adjust stressed state
    stressedExpenses = Math.max(30000, stressedExpenses - totalMonthlyRecovery);
    stressedLiquid += totalLumpSumRecovery;
    stressedNetWorth += totalLumpSumRecovery + totalMonthlyRecovery * 4;
  }

  const finalSavings = stressedIncome - stressedExpenses;
  const finalRunway = stressedExpenses > 0 ? Number((stressedLiquid / stressedExpenses).toFixed(1)) : 99;
  
  let finalResilience = calculateResilienceScore(
    stressedIncome,
    stressedExpenses,
    stressedLiquid,
    stressedNetWorth,
    stressedFixed
  );

  // Add lever bonuses
  finalResilience = Math.min(100, Math.max(12, finalResilience + totalResilienceBonus));

  // If recovery levers improved state, enhance verdict
  if (appliedLeverIds.length > 0) {
    verdict += \` 🚀 Recovery actions active: Applied \${appliedLeverIds.length} lever(s) restoring +₹\${totalMonthlyRecovery.toLocaleString('en-IN')}/mo cashflow and lifting Resilience by +\${totalResilienceBonus} pts.\`;
    if (finalResilience >= 70) {
      verdictSeverity = 'safe';
    } else if (finalResilience >= 50) {
      verdictSeverity = 'warning';
    }
  }

  const afterMetrics: FinancialMetrics = {
    resilience: finalResilience,
    runwayMonths: finalRunway,
    monthlySavings: finalSavings,
    netWorth: Math.round(stressedNetWorth),
    monthlyIncome: Math.round(stressedIncome),
    monthlyExpenses: Math.round(stressedExpenses),
    liquidEmergencyFund: Math.round(stressedLiquid),
    investments: baseline.investments,
    fixedExpenses: Math.round(stressedFixed),
    discretionaryExpenses: Math.round(stressedDiscretionary),
  };

  // Generate 6-Month Timeline
  const monthNames = ['Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027'];
  const timeline: TimelineMonth[] = [];
  const projections: ProjectionPoint[] = [];

  let runningNetWorth = afterMetrics.netWorth;
  let runningLiquid = afterMetrics.liquidEmergencyFund;

  for (let i = 0; i < 6; i++) {
    const mName = monthNames[i];
    
    // Baseline growth
    const bNet = baseline.netWorth + baseline.monthlySavings * (i + 1);
    const bRunway = baseline.runwayMonths + (i * 0.1);
    const bRes = Math.min(100, baseline.resilience + (i > 3 ? 1 : 0));

    // Stressed projection
    runningNetWorth += afterMetrics.monthlySavings;
    if (afterMetrics.monthlySavings < 0) {
      runningLiquid = Math.max(0, runningLiquid + afterMetrics.monthlySavings);
    } else {
      runningLiquid += afterMetrics.monthlySavings * 0.5;
    }

    const mRunway = afterMetrics.monthlyExpenses > 0 ? Number((runningLiquid / afterMetrics.monthlyExpenses).toFixed(1)) : 0;
    
    // Slight recovery curve over time
    let mRes = Math.min(100, Math.max(10, Math.round(afterMetrics.resilience + (i * (afterMetrics.monthlySavings >= 0 ? 1.5 : -2)))));
    if (appliedLeverIds.length > 0) {
      mRes = Math.min(100, mRes + (i * 2));
    }

    let mStatus: 'safe' | 'warning' | 'critical' = 'safe';
    if (mRes < 45 || mRunway < 2.5) {
      mStatus = 'critical';
    } else if (mRes < 70 || mRunway < 6.0) {
      mStatus = 'warning';
    }

    let mNote = 'Balanced cash flow and buffer';
    if (mStatus === 'critical') {
      mNote = \`Severe cash burn of ₹\${Math.abs(afterMetrics.monthlySavings).toLocaleString('en-IN')}/mo\`;
    } else if (mStatus === 'warning') {
      mNote = 'Constrained savings cushion';
    } else if (appliedLeverIds.length > 0) {
      mNote = 'Active recovery trajectory compounding';
    }

    timeline.push({
      monthIndex: i + 1,
      monthName: mName,
      resilience: mRes,
      runwayMonths: mRunway,
      netWorth: Math.round(runningNetWorth),
      monthlySavings: afterMetrics.monthlySavings,
      status: mStatus,
      notes: mNote,
    });

    projections.push({
      month: mName,
      baselineNetWorth: Math.round(bNet),
      stressedNetWorth: Math.round(runningNetWorth),
      baselineRunway: Number(bRunway.toFixed(1)),
      stressedRunway: mRunway,
      baselineResilience: bRes,
      stressedResilience: mRes,
    });
  }

  return {
    scenarioType,
    scenarioTitle: definition.title,
    scenarioDescription: definition.shortDesc,
    params,
    before: baseline,
    after: afterMetrics,
    verdict,
    verdictSeverity,
    topFactors,
    timeline,
    projections,
    recoveryLevers: levers,
    appliedLeverIds,
  };
}
`);

console.log('Step 2 complete: simulatorService');
// 3. src/lib/copilotMock.ts
write('src/lib/copilotMock.ts', `
import { CopilotMessage, FinancialMetrics, StressTestResult } from '../types/finance';
import { BASELINE_METRICS } from './simulatorService';

export const SUGGESTED_QUESTIONS = [
  'How healthy are my finances?',
  'Why did my resilience drop?',
  'How can I improve it?',
  'Can I afford a ₹80,000 laptop?',
  'What happens if I lose my income?',
  'How much emergency fund should I target?',
];

/**
 * Deterministic AI Copilot financial response generator
 */
export function generateCopilotResponse(
  question: string,
  metrics: FinancialMetrics = BASELINE_METRICS,
  activeScenario: StressTestResult | null = null
): CopilotMessage {
  const normalized = question.toLowerCase().trim();
  const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. "How healthy are my finances?"
  if (
    normalized.includes('healthy') ||
    normalized.includes('health') ||
    normalized.includes('how are my finances') ||
    normalized.includes('financial status') ||
    normalized.includes('overview')
  ) {
    const isGood = metrics.resilience >= 75;
    const isModerate = metrics.resilience >= 50 && metrics.resilience < 75;

    return {
      id,
      sender: 'assistant',
      timestamp,
      diagnosisBadge: {
        label: isGood ? 'HEALTHY & STABLE' : isModerate ? 'MODERATE VULNERABILITY' : 'CRITICAL ATTENTION NEEDED',
        variant: isGood ? 'safe' : isModerate ? 'warning' : 'critical',
      },
      content: \`Here is your **Financial Twin Diagnosis**:

Your overall Resilience Score is **\${metrics.resilience}/100**, placing you in the **\${isGood ? 'Strong Top 15%' : isModerate ? 'Moderate Caution Zone' : 'High Risk Bracket'}** of peer financial profiles.

### Core Vitals:
* **Emergency Runway**: \`\${metrics.runwayMonths} months\` (Target: 6.0+ months) — \${metrics.runwayMonths >= 6 ? '✅ Well insulated against sudden shocks.' : '⚠️ Below optimal safety buffer.'}
* **Monthly Savings Surplus**: \`₹\${metrics.monthlySavings.toLocaleString('en-IN')}/mo\` (\${((metrics.monthlySavings / (metrics.monthlyIncome || 1)) * 100).toFixed(1)}% savings rate).
* **Liquid Safety Buffer**: \`₹\${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` liquid cash.
* **Total Net Worth**: \`₹\${metrics.netWorth.toLocaleString('en-IN')}\`.\`,
      metricsHighlight: [
        { label: 'Resilience Score', value: \`\${metrics.resilience}/100\`, positive: isGood },
        { label: 'Runway', value: \`\${metrics.runwayMonths} mo\`, positive: metrics.runwayMonths >= 6 },
        { label: 'Monthly Surplus', value: \`₹\${metrics.monthlySavings.toLocaleString('en-IN')}\`, positive: metrics.monthlySavings > 0 },
        { label: 'Net Worth', value: \`₹\${metrics.netWorth.toLocaleString('en-IN')}\`, positive: true },
      ],
      actionSteps: [
        'Maintain automatic monthly allocation of ₹23,000 to high-yield sweep reserves.',
        'Keep fixed recurring costs (Rent + EMIs) capped strictly under 50% of monthly income.',
        'Run stress tests in the Simulator to stress-test against unexpected job or rent shocks.',
      ],
      suggestedFollowUps: [
        'What happens if I lose my income?',
        'Can I afford a ₹80,000 laptop?',
        'How much emergency fund should I target?',
      ],
    };
  }

  // 2. "Why did my resilience drop?"
  if (
    normalized.includes('why did my resilience drop') ||
    normalized.includes('resilience drop') ||
    normalized.includes('score drop') ||
    normalized.includes('why is score low') ||
    normalized.includes('why dropped')
  ) {
    if (activeScenario) {
      return {
        id,
        sender: 'assistant',
        timestamp,
        diagnosisBadge: {
          label: \`STRESS TEST DIAGNOSIS: \${activeScenario.scenarioTitle.toUpperCase()}\`,
          variant: activeScenario.verdictSeverity,
        },
        content: \`Your resilience score adjusted from **\${activeScenario.before.resilience}** down to **\${activeScenario.after.resilience}** due to the simulated **\${activeScenario.scenarioTitle}** scenario.

### Primary Drivers of the Score Drop:
1. **\${activeScenario.topFactors[0]?.factor || 'Cash Flow Contraction'}**: \${activeScenario.topFactors[0]?.impact || 'Negative balance'}
2. **\${activeScenario.topFactors[1]?.factor || 'Runway Depletion'}**: \${activeScenario.topFactors[1]?.impact || 'Buffer reduced'}
3. **\${activeScenario.topFactors[2]?.factor || 'Fixed Obligation Pressure'}**: \${activeScenario.topFactors[2]?.impact || 'Rigidity'}

> \${activeScenario.verdict}\`,
        metricsHighlight: [
          { label: 'Pre-Stress Resilience', value: \`\${activeScenario.before.resilience}\`, positive: true },
          { label: 'Stressed Resilience', value: \`\${activeScenario.after.resilience}\`, change: \`-\${activeScenario.before.resilience - activeScenario.after.resilience}\`, positive: false },
          { label: 'Stressed Runway', value: \`\${activeScenario.after.runwayMonths} mo\`, change: \`-\${(activeScenario.before.runwayMonths - activeScenario.after.runwayMonths).toFixed(1)} mo\`, positive: false },
        ],
        actionSteps: [
          'Review the "HOW CAN WE RECOVER?" section on the /simulator page to apply recovery levers.',
          'Implement discretionary spending cuts (-₹5,000 to -₹12,000/mo) to restore positive cash flow.',
          'Consider activating temporary bridge freelance or consulting work.',
        ],
        suggestedFollowUps: [
          'How can I improve it?',
          'What happens if I lose my income?',
          'How much emergency fund should I target?',
        ],
      };
    }

    return {
      id,
      sender: 'assistant',
      timestamp,
      diagnosisBadge: {
        label: 'BASELINE RESILIENCE FACTOR BREAKDOWN',
        variant: 'info',
      },
      content: \`In your baseline state, your score is **\${metrics.resilience}/100**.

Financial resilience is computed across 4 core vectors:
1. **Savings Rate (35% weight)**: Current surplus is ₹\${metrics.monthlySavings.toLocaleString('en-IN')}/mo (\${((metrics.monthlySavings / metrics.monthlyIncome) * 100).toFixed(0)}% of income).
2. **Runway Ratio (40% weight)**: Liquid reserves cover \${metrics.runwayMonths} months of expenses.
3. **Fixed-to-Income Overhead (15% weight)**: Fixed costs (Rent + Utilities + EMIs) consume \${((metrics.fixedExpenses / metrics.monthlyIncome) * 100).toFixed(0)}% of earnings.
4. **Liquid vs Invested Net Worth (10% weight)**: Net worth buffer of ₹\${metrics.netWorth.toLocaleString('en-IN')}.

If you run a stress test in **/simulator**, any drop is caused by cashflow deficit or runway contraction.\`,
      actionSteps: [
        'Navigate to /simulator to run what-if scenarios.',
        'Apply recovery levers to see resilience bounce back.',
      ],
      suggestedFollowUps: [
        'How can I improve it?',
        'What happens if I lose my income?',
      ],
    };
  }

  // 3. "How can I improve it?"
  if (
    normalized.includes('how can i improve') ||
    normalized.includes('improve it') ||
    normalized.includes('boost score') ||
    normalized.includes('increase resilience') ||
    normalized.includes('recovery plan')
  ) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      diagnosisBadge: {
        label: 'OPTIMIZATION ROADMAP (+12 to +18 PTS)',
        variant: 'safe',
      },
      content: \`Here are 3 deterministic levers to elevate your Financial Resilience from **\${metrics.resilience}** towards **95+**:

### 1. Discretionary Spending Optimization (Estimated: +6 to +8 pts)
* Cap dining out and discretionary subscriptions by ₹5,000/month.
* **Annual Impact**: Adds ₹60,000 directly to liquid emergency reserves.

### 2. Emergency Vault Expansion (Estimated: +5 to +7 pts)
* Expand liquid savings from \`₹\${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` to \`₹4,92,000\` (full 6-month fixed expense coverage).
* **Runway Impact**: Extends total runway beyond 12+ months.

### 3. Secondary Cashflow Diversification (Estimated: +8 to +12 pts)
* Introduce a ₹10,000–₹15,000/month side retainer or skill monetization.
* **Shock Absorption**: Prevents negative monthly cash flow in the event of primary salary interruption.\`,
      actionSteps: [
        'Auto-divert ₹5,000 from current discretionary budget into high-yield sweep account.',
        'Lock current fixed costs below ₹55,000/month.',
        'Use the /simulator page to simulate and test these recovery levers live.',
      ],
      suggestedFollowUps: [
        'Can I afford a ₹80,000 laptop?',
        'How much emergency fund should I target?',
        'What happens if I lose my income?',
      ],
    };
  }

  // 4. "Can I afford a ₹80,000 laptop?"
  if (
    normalized.includes('laptop') ||
    normalized.includes('80,000') ||
    normalized.includes('80000') ||
    normalized.includes('afford') ||
    normalized.includes('buy') ||
    normalized.includes('purchase')
  ) {
    const cost = 80000;
    const remainingFund = metrics.liquidEmergencyFund - cost;
    const postRunway = Number((remainingFund / metrics.monthlyExpenses).toFixed(1));
    const monthsToSave = Math.ceil(cost / Math.max(1, metrics.monthlySavings));

    return {
      id,
      sender: 'assistant',
      timestamp,
      diagnosisBadge: {
        label: 'AFFORDABILITY VERDICT: APPROVED (WITH CASH FLOW PLAN)',
        variant: 'safe',
      },
      content: \`### Diagnosis: **Yes, you can afford a ₹80,000 laptop**, but using your liquid cash all at once has tradeoffs.

* **Upfront Cash Purchase**:
  * Liquid Emergency Fund drops from \`₹\${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` $\\rightarrow$ \`₹\${remainingFund.toLocaleString('en-IN')}\`.
  * Runway decreases from \`\${metrics.runwayMonths} mo\` $\\rightarrow$ \`\${postRunway} mo\` *(Still safely above the 6-month minimum threshold)*.
  * Resilience Score impact: ~ -3 points temporary dip (from \${metrics.resilience} to \${metrics.resilience - 3}).

* **Zero-Interest / 3-Month Savings Route (Recommended)**:
  * At your current monthly surplus of \`₹\${metrics.monthlySavings.toLocaleString('en-IN')}/mo\`, you will fully fund this purchase in **\${monthsToSave} months** without touching emergency reserves!\`,
      metricsHighlight: [
        { label: 'Purchase Cost', value: '₹80,000', positive: false },
        { label: 'Post-Buy Liquid Fund', value: \`₹\${remainingFund.toLocaleString('en-IN')}\`, positive: true },
        { label: 'Post-Buy Runway', value: \`\${postRunway} months\`, positive: postRunway >= 6 },
        { label: 'Months to Save', value: \`\${monthsToSave} months\`, positive: true },
      ],
      actionSteps: [
        \`Allocate ₹\${Math.round(cost / 3).toLocaleString('en-IN')}/mo over the next 3 months to purchase cash-positive.\`,
        'Preserve the core ₹2,00,000 liquid emergency floor untouched.',
      ],
      suggestedFollowUps: [
        'How much emergency fund should I target?',
        'How healthy are my finances?',
      ],
    };
  }

  // 5. "What happens if I lose my income?"
  if (
    normalized.includes('lose my income') ||
    normalized.includes('lost my job') ||
    normalized.includes('job loss') ||
    normalized.includes('unemployed') ||
    normalized.includes('layoff')
  ) {
    const monthlyBurn = metrics.monthlyExpenses;
    const runwayExact = Number((metrics.liquidEmergencyFund / monthlyBurn).toFixed(1));
    const totalWithInvestments = Number(((metrics.liquidEmergencyFund + metrics.investments) / monthlyBurn).toFixed(1));

    return {
      id,
      sender: 'assistant',
      timestamp,
      diagnosisBadge: {
        label: \`RUNWAY SIMULATION: \${runwayExact} MONTHS SURVIVAL BUFFER\`,
        variant: runwayExact >= 6 ? 'warning' : 'critical',
      },
      content: \`### If your primary income drops to ₹0 tomorrow:

1. **Pure Liquid Survival**:
   * With **₹\${metrics.liquidEmergencyFund.toLocaleString('en-IN')}** in liquid reserves and **₹\${monthlyBurn.toLocaleString('en-IN')}/month** burn, you have exactly **\${runwayExact} months** before needing to liquidate investments or take loans.

2. **Total Liquidity (Liquid + Investments)**:
   * Total net worth of ₹\${metrics.netWorth.toLocaleString('en-IN')} provides up to **\${totalWithInvestments} months** of absolute runway.

3. **Emergency Defensive Action Plan**:
   * Cutting discretionary spending from ₹30,000 $\\rightarrow$ ₹8,000 drops your burn rate from ₹82,000 $\\rightarrow$ **₹60,000/mo**, expanding runway from \`\${runwayExact} mo\` $\\rightarrow$ **\${Number((metrics.liquidEmergencyFund / 60000).toFixed(1))} months**!\`,
      metricsHighlight: [
        { label: 'Monthly Burn', value: \`₹\${monthlyBurn.toLocaleString('en-IN')}/mo\`, positive: false },
        { label: 'Pure Liquid Runway', value: \`\${runwayExact} months\`, positive: runwayExact >= 6 },
        { label: 'Defensive Runway (Trimmed)', value: \`\${Number((metrics.liquidEmergencyFund / 60000).toFixed(1))} months\`, positive: true },
      ],
      actionSteps: [
        'Test the "Job Loss" scenario in /simulator to visualize your 6-month cashflow curve.',
        'Set up a pre-planned "Emergency Budget" trigger to freeze non-essential expenses in one click.',
      ],
      suggestedFollowUps: [
        'How can I improve it?',
        'How much emergency fund should I target?',
        'Why did my resilience drop?',
      ],
    };
  }

  // 6. "How much emergency fund should I target?"
  if (
    normalized.includes('emergency fund') ||
    normalized.includes('how much emergency') ||
    normalized.includes('target') ||
    normalized.includes('how much buffer')
  ) {
    const fixedMonthly = metrics.fixedExpenses;
    const totalMonthly = metrics.monthlyExpenses;
    const target3Mo = fixedMonthly * 3;
    const target6Mo = totalMonthly * 6;
    const target12Mo = totalMonthly * 12;

    return {
      id,
      sender: 'assistant',
      timestamp,
      diagnosisBadge: {
        label: 'EMERGENCY BUFFER BENCHMARK',
        variant: 'safe',
      },
      content: \`### Recommended Emergency Fund Targets for Your Profile:

* **Tier 1 (Minimum Survival - 3 Months Fixed Costs)**: \`₹\${target3Mo.toLocaleString('en-IN')}\` *(Covers rent, EMIs, groceries)*.
* **Tier 2 (Optimal Recommended - 6 Months Total Burn)**: \`₹\${target6Mo.toLocaleString('en-IN')}\` ⭐ **(Your Target Benchmark)**.
* **Tier 3 (Bulletproof Independence - 12 Months)**: \`₹\${target12Mo.toLocaleString('en-IN')}\`.

### Your Current Position:
* Current liquid buffer: \`₹\${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` (\${metrics.runwayMonths} months).
* **Gap to 6-Month Gold Standard**: \`₹\${Math.max(0, target6Mo - metrics.liquidEmergencyFund).toLocaleString('en-IN')}\` remaining. At ₹23,000/mo savings, you can close this in **\${Math.ceil(Math.max(0, target6Mo - metrics.liquidEmergencyFund) / metrics.monthlySavings)} months**.\`,
      metricsHighlight: [
        { label: 'Current Buffer', value: \`₹\${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\`, positive: true },
        { label: '6-Month Target', value: \`₹\${target6Mo.toLocaleString('en-IN')}\`, positive: true },
        { label: 'Current Coverage', value: \`\${metrics.runwayMonths} mo\`, positive: true },
      ],
      actionSteps: [
        'Keep 50% of the emergency fund in instant-access savings and 50% in sweep-in flexi-FDs.',
        'Do not lock emergency capital in volatile equity or illiquid lock-in vehicles.',
      ],
      suggestedFollowUps: [
        'How healthy are my finances?',
        'Can I afford a ₹80,000 laptop?',
        'How can I improve it?',
      ],
    };
  }

  // Fallback intelligent general response
  return {
    id,
    sender: 'assistant',
    timestamp,
    diagnosisBadge: {
      label: 'FINANCIAL TWIN COPILOT ADVICE',
      variant: 'info',
    },
    content: \`Based on your live **Financial Twin** parameters:

* **Resilience Score**: \`\${metrics.resilience}/100\`
* **Runway**: \`\${metrics.runwayMonths} months\`
* **Monthly Savings Surplus**: \`₹\${metrics.monthlySavings.toLocaleString('en-IN')}\`
* **Net Worth**: \`₹\${metrics.netWorth.toLocaleString('en-IN')}\`

For your query regarding **"\${question}"**:
Your profile has a healthy core savings foundation. When making major allocation or spending decisions, ensure your liquid runway does not drop below 6 months (\`₹\${(metrics.monthlyExpenses * 6).toLocaleString('en-IN')}\`) and keep your fixed expense commitments below 50% of total revenue.\`,
    actionSteps: [
      'Simulate high-impact scenarios on the /simulator page to preview changes to your financial timeline.',
      'Check suggested questions below for deep-dive diagnostics.',
    ],
    suggestedFollowUps: [
      'How healthy are my finances?',
      'Why did my resilience drop?',
      'How can I improve it?',
    ],
  };
}
`);

console.log('Step 3 complete: copilotMock');
// 4. src/components/Navbar.tsx
write('src/components/Navbar.tsx', `
import React from 'react';
import { ShieldCheck, Cpu, Activity, Sparkles, SlidersHorizontal, MessageSquareText, Home } from 'lucide-react';
import { FinancialMetrics } from '../types/finance';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  metrics: FinancialMetrics;
  isStressed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, metrics, isStressed }) => {
  const getResilienceColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b12]/85 border-b border-surface-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-glow-emerald group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Finance<span className="text-emerald-400">Guard</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Twin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Stress Testing & AI Copilot</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-surface-border shadow-inner">
            <button
              onClick={() => navigate('/simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentRoute === '/simulator'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>What-If Simulator</span>
            </button>

            <button
              onClick={() => navigate('/copilot')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentRoute === '/copilot'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>AI Copilot</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </button>
          </nav>

          {/* Right Live Twin Badge */}
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${getResilienceColor(metrics.resilience)}`}>
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Twin Resilience:</span>
              <span className="font-mono text-sm font-bold">{metrics.resilience}/100</span>
              {isStressed && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  Simulated
                </span>
              )}
            </div>

            <div className="text-right hidden md:block">
              <span className="text-[11px] text-slate-400 block">Runway</span>
              <span className="font-mono text-xs font-semibold text-slate-200">{metrics.runwayMonths} mo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
`);

console.log('Step 4 complete: Navbar');
// 5. src/components/MetricCard.tsx
write('src/components/MetricCard.tsx', `
import React from 'react';
import { ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  beforeValue: string | number;
  afterValue: string | number;
  unit?: string;
  isCurrency?: boolean;
  deltaText?: string;
  isPositiveChange?: boolean;
  isNeutral?: boolean;
  subtext?: string;
  progressPercent?: number;
  colorScheme?: 'emerald' | 'amber' | 'rose' | 'cyan';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  beforeValue,
  afterValue,
  unit = '',
  isCurrency = false,
  deltaText,
  isPositiveChange,
  isNeutral = false,
  subtext,
  progressPercent,
  colorScheme = 'emerald',
}) => {
  const formatVal = (val: string | number) => {
    if (typeof val === 'number') {
      if (isCurrency) {
        return '₹' + val.toLocaleString('en-IN');
      }
      return val.toString();
    }
    return val;
  };

  const formattedBefore = formatVal(beforeValue);
  const formattedAfter = formatVal(afterValue);
  const isChanged = formattedBefore !== formattedAfter;

  const getDeltaBadge = () => {
    if (isNeutral || !isChanged) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          <Minus className="w-3 h-3" /> Baseline
        </span>
      );
    }
    if (isPositiveChange) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
          <TrendingUp className="w-3 h-3" /> {deltaText || 'Improved'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
        <TrendingDown className="w-3 h-3" /> {deltaText || 'Declined'}
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-surface-border p-5 hover:border-slate-600 transition-all shadow-lg backdrop-blur-sm group">
      {/* Background Subtle Gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
        isPositiveChange ? 'from-emerald-500 to-teal-400' : isNeutral ? 'from-slate-600 to-slate-500' : 'from-rose-500 to-amber-500'
      }`} />

      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        {getDeltaBadge()}
      </div>

      {/* Before -> After Visual */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Before</span>
          <span className="text-sm font-mono text-slate-400 line-through decoration-slate-600">
            {formattedBefore}{unit}
          </span>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />

        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">After</span>
          <span className={`text-2xl font-bold font-mono tracking-tight transition-all duration-300 ${
            isPositiveChange ? 'text-emerald-400' : isNeutral ? 'text-white' : 'text-rose-400'
          }`}>
            {formattedAfter}<span className="text-sm font-normal text-slate-400 ml-0.5">{unit}</span>
          </span>
        </div>
      </div>

      {/* Mini Progress Bar if applicable */}
      {typeof progressPercent === 'number' && (
        <div className="mt-3">
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent >= 70 ? 'bg-emerald-500' : progressPercent >= 40 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: \`\${Math.min(100, Math.max(5, progressPercent))}%\` }}
            />
          </div>
        </div>
      )}

      {subtext && (
        <p className="text-[12px] text-slate-400 mt-2.5 leading-relaxed">{subtext}</p>
      )}
    </div>
  );
};
`);

console.log('Step 5 complete: MetricCard');
// 6. src/components/ProjectionChart.tsx
write('src/components/ProjectionChart.tsx', `
import React, { useState } from 'react';
import { ProjectionPoint } from '../types/finance';
import { LineChart, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface ProjectionChartProps {
  projections: ProjectionPoint[];
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({ projections }) => {
  const [metricMode, setMetricMode] = useState<'netWorth' | 'runway' | 'resilience'>('netWorth');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!projections || projections.length === 0) return null;

  // Compute SVG plotting bounds
  const getValues = () => {
    switch (metricMode) {
      case 'netWorth':
        return {
          baseline: projections.map((p) => p.baselineNetWorth),
          stressed: projections.map((p) => p.stressedNetWorth),
          formatter: (v: number) => '₹' + (v / 100000).toFixed(2) + 'L',
          unit: '',
          title: 'Net Worth Trajectory',
        };
      case 'runway':
        return {
          baseline: projections.map((p) => p.baselineRunway),
          stressed: projections.map((p) => p.stressedRunway),
          formatter: (v: number) => v.toFixed(1) + ' mo',
          unit: ' months',
          title: 'Emergency Runway Trajectory',
        };
      case 'resilience':
        return {
          baseline: projections.map((p) => p.baselineResilience),
          stressed: projections.map((p) => p.stressedResilience),
          formatter: (v: number) => v.toString() + '/100',
          unit: ' pts',
          title: 'Resilience Score Trajectory',
        };
    }
  };

  const { baseline, stressed, formatter, unit, title } = getValues();
  const allVals = [...baseline, ...stressed];
  const minVal = Math.min(...allVals) * 0.92;
  const maxVal = Math.max(...allVals) * 1.08 || 100;
  const range = maxVal - minVal || 1;

  const width = 680;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getX = (index: number) => paddingX + (index / (projections.length - 1)) * chartW;
  const getY = (val: number) => height - paddingY - ((val - minVal) / range) * chartH;

  const baselinePoints = baseline.map((val, idx) => \`\${getX(idx)},\${getY(val)}\`).join(' ');
  const stressedPoints = stressed.map((val, idx) => \`\${getX(idx)},\${getY(val)}\`).join(' ');

  // Stressed fill area
  const stressedAreaPoints = \`\${getX(0)},\${height - paddingY} \${stressedPoints} \${getX(projections.length - 1)},\${height - paddingY}\`;

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">6-Month Forward Projection: Baseline vs Stress Scenario</p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-surface p-1 rounded-xl border border-surface-border self-start">
          <button
            onClick={() => setMetricMode('netWorth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'netWorth'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Net Worth
          </button>
          <button
            onClick={() => setMetricMode('runway')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'runway'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Runway
          </button>
          <button
            onClick={() => setMetricMode('resilience')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'resilience'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resilience
          </button>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={\`0 0 \${width} \${height}\`}
          className="w-full h-auto min-w-[540px] overflow-visible"
        >
          <defs>
            <linearGradient id="stressedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * chartH;
            const val = minVal + ratio * range;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {formatter(val)}
                </text>
              </g>
            );
          })}

          {/* Stressed Area Fill */}
          <polygon points={stressedAreaPoints} fill="url(#stressedGrad)" />

          {/* Baseline Line (Green/Cyan Dashed) */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            points={baselinePoints}
            className="transition-all duration-300"
          />

          {/* Stressed Line (Rose/Amber Solid) */}
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3"
            points={stressedPoints}
            className="transition-all duration-300"
          />

          {/* X Axis Labels and Data Dots */}
          {projections.map((p, idx) => {
            const x = getX(idx);
            const yBase = getY(baseline[idx]);
            const yStress = getY(stressed[idx]);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Baseline Dot */}
                <circle
                  cx={x}
                  cy={yBase}
                  r={isHovered ? 6 : 4}
                  fill="#10b981"
                  stroke="#090d16"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Stressed Dot */}
                <circle
                  cx={x}
                  cy={yStress}
                  r={isHovered ? 7 : 5}
                  fill="#f43f5e"
                  stroke="#090d16"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* X Axis Label */}
                <text
                  x={x}
                  y={height - paddingY + 18}
                  fill={isHovered ? '#38bdf8' : '#94a3b8'}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {p.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Active Hover Tooltip Card */}
      <div className="mt-4 pt-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400 inline-block"></span>
            <span className="text-slate-300 font-medium">Baseline Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-rose-500 rounded inline-block"></span>
            <span className="text-rose-300 font-medium">Stress-Tested Trajectory</span>
          </div>
        </div>

        {hoveredIndex !== null ? (
          <div className="flex items-center gap-3 bg-surface-elevated px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-[11px]">
            <span className="text-slate-400 font-sans">{projections[hoveredIndex].month}:</span>
            <span className="text-emerald-400">Base: {formatter(baseline[hoveredIndex])}</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">Stressed: {formatter(stressed[hoveredIndex])}</span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">Hover over data points to inspect monthly divergence</span>
        )}
      </div>
    </div>
  );
};
`);

console.log('Step 6 complete: ProjectionChart');
// 7. src/components/TimelineView.tsx
write('src/components/TimelineView.tsx', `
import React from 'react';
import { TimelineMonth } from '../types/finance';
import { Calendar, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineMonth[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  const getStatusBadge = (status: TimelineMonth['status']) => {
    switch (status) {
      case 'safe':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Safe',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Warning',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'critical':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Critical',
          classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
    }
  };

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">6-Month Future Timeline</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Month-by-month financial twin health projection</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-slate-300">
          Forward Horizon: 6 Mo
        </span>
      </div>

      {/* Grid of 6 months */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {timeline.map((m) => {
          const badge = getStatusBadge(m.status);
          const isNegativeSavings = m.monthlySavings < 0;

          return (
            <div
              key={m.monthIndex}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                m.status === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  : m.status === 'warning'
                  ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-surface-elevated/80 border-surface-border hover:border-emerald-500/30'
              }`}
            >
              <div>
                {/* Month Header */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    {m.monthName}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border \${badge.classes}\`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>

                {/* Score & Runway */}
                <div className="space-y-1.5 my-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[11px] font-sans">Resilience:</span>
                    <span className={`font-bold \${
                      m.resilience >= 75 ? 'text-emerald-400' : m.resilience >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }\`}>
                      {m.resilience}/100
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[11px] font-sans">Runway:</span>
                    <span className="text-slate-200 font-semibold">{m.runwayMonths} mo</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[11px] font-sans">Net Worth:</span>
                    <span className="text-slate-200">₹{(m.netWorth / 100000).toFixed(2)}L</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-700/50">
                    <span className="text-[11px] font-sans">Cashflow:</span>
                    <span className={`font-semibold \${isNegativeSavings ? 'text-rose-400' : 'text-emerald-400'}\`}>
                      {isNegativeSavings ? '-' : '+'}₹{Math.abs(m.monthlySavings).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
                {m.notes}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`);

console.log('Step 7 complete: TimelineView');
// 8. src/components/RecoveryLevers.tsx
write('src/components/RecoveryLevers.tsx', `
import React from 'react';
import { RecoveryLever } from '../types/finance';
import { Sparkles, Check, Plus, ArrowUpRight, ShieldAlert, Zap } from 'lucide-react';

interface RecoveryLeversProps {
  levers: RecoveryLever[];
  onToggleLever: (leverId: string) => void;
  appliedCount: number;
}

export const RecoveryLevers: React.FC<RecoveryLeversProps> = ({
  levers,
  onToggleLever,
  appliedCount,
}) => {
  if (!levers || levers.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0f1d2e] to-[#0a121f] border-2 border-emerald-500/40 p-6 sm:p-8 shadow-glow-emerald backdrop-blur-md relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Action & Recovery Plan
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                HOW CAN WE RECOVER?
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Deterministic recovery levers tailored to neutralize stress, rebalance cash flow, and restore your Resilience score.
          </p>
        </div>

        {/* Action Status Pill */}
        <div className="flex items-center gap-2 bg-[#080d16] px-3.5 py-2 rounded-xl border border-emerald-500/30 self-start">
          <span className="text-xs text-slate-300 font-medium">Applied Actions:</span>
          <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
            {appliedCount}/{levers.length} Active
          </span>
        </div>
      </div>

      {/* Levers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {levers.map((lever) => {
          const isApplied = lever.applied;

          return (
            <div
              key={lever.id}
              className={`rounded-xl p-5 border transition-all duration-300 flex flex-col justify-between relative \${
                isApplied
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-glow-emerald scale-[1.02]'
                  : 'bg-surface-card border-surface-border hover:border-slate-500'
              }\`}
            >
              <div>
                {/* Top Badge: Estimated resilience boost */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    +{lever.resilienceBoost} Resilience Pts
                  </span>

                  {lever.monthlyImpact > 0 && (
                    <span className="text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                      +₹{lever.monthlyImpact.toLocaleString('en-IN')}/mo
                    </span>
                  )}
                  {lever.lumpSumImpact > 0 && (
                    <span className="text-xs font-mono font-semibold text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/20">
                      +₹{lever.lumpSumImpact.toLocaleString('en-IN')} Cash
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-base text-white tracking-tight mb-1.5">
                  {lever.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {lever.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onToggleLever(lever.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 \${
                  isApplied
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400'
                    : 'bg-surface-elevated text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }\`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>APPLIED (ACTIVE)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>APPLY RECOVERY LEVER</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer flow tip */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2 font-mono">
          <span className="text-rose-400 font-bold uppercase">Problem</span>
          <span>→</span>
          <span className="text-amber-400 font-bold uppercase">Action</span>
          <span>→</span>
          <span className="text-emerald-400 font-bold uppercase">Recovery</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Clicking APPLY immediately recalculates your twin and animates resilience recovery.
        </span>
      </div>
    </div>
  );
};
`);

console.log('Step 8 complete: RecoveryLevers');
// 9. src/components/ScenarioControls.tsx
write('src/components/ScenarioControls.tsx', `
import React from 'react';
import { ScenarioType } from '../types/finance';
import { Play, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ScenarioControlsProps {
  scenarioType: ScenarioType;
  params: Record<string, any>;
  onParamChange: (key: string, value: any) => void;
  onResetParams: () => void;
  onRunStressTest: () => void;
  isCalculating: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  scenarioType,
  params,
  onParamChange,
  onResetParams,
  onRunStressTest,
  isCalculating,
}) => {
  return (
    <div className="rounded-2xl bg-surface-elevated/90 border border-surface-border p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Step 2: Calibrate Variables
          </span>
          <h3 className="font-bold text-lg text-white">Scenario Parameters</h3>
        </div>
        <button
          onClick={onResetParams}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Dynamic Controls depending on selected scenario */}
      <div className="space-y-5">
        {scenarioType === 'job_loss' && (
          <>
            {/* Income Drop Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Income Loss Severity:</span>
                <span className="font-mono text-rose-400 text-sm font-bold bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/20">
                  {params.incomeDropPercent ?? 100}% Loss (-₹{Math.round(105000 * ((params.incomeDropPercent ?? 100) / 100)).toLocaleString('en-IN')}/mo)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={params.incomeDropPercent ?? 100}
                onChange={(e) => onParamChange('incomeDropPercent', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>10% (Minor Pay Cut)</span>
                <span>50% (Half Salary)</span>
                <span>100% (Complete Layoff)</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Unemployment / Disruption Duration:</span>
                <span className="font-mono text-amber-400 text-sm font-bold bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {params.durationMonths ?? 4} Months
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={params.durationMonths ?? 4}
                onChange={(e) => onParamChange('durationMonths', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>1 Month</span>
                <span>4 Months (Avg Job Search)</span>
                <span>12 Months</span>
              </div>
            </div>

            {/* Severance Preset */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Severance or Gratuity Payout (Optional):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => onParamChange('severancePay', amt)}
                    className={`py-2 px-2 text-xs font-mono rounded-lg border transition-all ${
                      (params.severancePay ?? 0) === amt
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                    }`}
                  >
                    {amt === 0 ? 'None' : \`+₹\${(amt / 1000).toFixed(0)}k\`}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {scenarioType === 'rent_increase' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Monthly Rent Increase:</span>
                <span className="font-mono text-rose-400 text-sm font-bold bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/20">
                  +₹{Number(params.rentIncreaseAmount ?? 12000).toLocaleString('en-IN')}/month
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="1000"
                value={params.rentIncreaseAmount ?? 12000}
                onChange={(e) => onParamChange('rentIncreaseAmount', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>+₹2,000/mo</span>
                <span>+₹12,000/mo</span>
                <span>+₹30,000/mo</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Common Lease Escalation Scenarios:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '5% Inflation', val: 3500 },
                  { label: 'City Relocation', val: 12000 },
                  { label: 'Prime Upgrade', val: 20000 },
                ].map((p) => (
                  <button
                    key={p.val}
                    onClick={() => onParamChange('rentIncreaseAmount', p.val)}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all ${
                      Number(params.rentIncreaseAmount) === p.val
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-medium">{p.label}</span>
                    <span className="font-mono text-[10px] text-slate-500">+₹{p.val.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {scenarioType === 'emergency_expense' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Unplanned Emergency Expense:</span>
                <span className="font-mono text-rose-400 text-sm font-bold bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/20">
                  ₹{Number(params.expenseAmount ?? 150000).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="25000"
                max="400000"
                step="25000"
                value={params.expenseAmount ?? 150000}
                onChange={(e) => onParamChange('expenseAmount', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>₹25,000</span>
                <span>₹1,50,000 (Major Medical)</span>
                <span>₹4,00,000</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Emergency Shock Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Hospital / Medical', 'Home Structural', 'Vehicle Engine', 'Family Emergency'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onParamChange('category', cat)}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all ${
                      (params.category ?? 'Hospital / Medical') === cat
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {scenarioType === 'income_boost' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Additional Monthly Inflow:</span>
                <span className="font-mono text-emerald-400 text-sm font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  +₹{Number(params.additionalIncome ?? 25000).toLocaleString('en-IN')}/month
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="60000"
                step="5000"
                value={params.additionalIncome ?? 25000}
                onChange={(e) => onParamChange('additionalIncome', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>+₹5,000/mo</span>
                <span>+₹25,000/mo</span>
                <span>+₹60,000/mo</span>
              </div>
            </div>
          </>
        )}

        {scenarioType === 'cut_spending' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Monthly Spending Reduction:</span>
                <span className="font-mono text-emerald-400 text-sm font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  -₹{Number(params.monthlyCutAmount ?? 10000).toLocaleString('en-IN')}/month
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="25000"
                step="1000"
                value={params.monthlyCutAmount ?? 10000}
                onChange={(e) => onParamChange('monthlyCutAmount', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>-₹2,000/mo</span>
                <span>-₹10,000/mo</span>
                <span>-₹25,000/mo</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RUN STRESS TEST Button */}
      <div className="mt-6 pt-5 border-t border-surface-border">
        <button
          onClick={onRunStressTest}
          disabled={isCalculating}
          className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
            isCalculating
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 hover:shadow-glow-emerald active:scale-[0.99]'
          }`}
        >
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Simulating Financial Shockwave...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950" />
              <span>RUN STRESS TEST</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
`);

console.log('Step 9 complete: ScenarioControls');
// 10. src/routes/SimulatorPage.tsx
write('src/routes/SimulatorPage.tsx', `
import React, { useState, useEffect } from 'react';
import { 
  BASELINE_METRICS, 
  SCENARIO_DEFINITIONS, 
  runStressTest, 
  ScenarioDefinition 
} from '../lib/simulatorService';
import { 
  ScenarioType, 
  StressTestResult, 
  FinancialMetrics 
} from '../types/finance';
import { MetricCard } from '../components/MetricCard';
import { ProjectionChart } from '../components/ProjectionChart';
import { TimelineView } from '../components/TimelineView';
import { RecoveryLevers } from '../components/RecoveryLevers';
import { ScenarioControls } from '../components/ScenarioControls';
import { 
  ShieldCheck, 
  Briefcase, 
  Home, 
  AlertTriangle, 
  TrendingUp, 
  Scissors, 
  Activity, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  MessageSquareText, 
  Layers, 
  Info,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface SimulatorPageProps {
  navigate: (route: string) => void;
  onUpdateStressedState: (result: StressTestResult | null) => void;
  activeTestResult: StressTestResult | null;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  navigate,
  onUpdateStressedState,
  activeTestResult,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('job_loss');
  const [scenarioParams, setScenarioParams] = useState<Record<string, any>>(() => {
    const initial = SCENARIO_DEFINITIONS.find((s) => s.type === 'job_loss')?.defaultParams || {};
    return { ...initial };
  });

  const [appliedLeverIds, setAppliedLeverIds] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<StressTestResult>(() => {
    if (activeTestResult) return activeTestResult;
    // Initial run
    return runStressTest(BASELINE_METRICS, 'job_loss', { incomeDropPercent: 100, durationMonths: 4, severancePay: 0 }, []);
  });

  // When scenario changes, load its default parameters
  const handleSelectScenario = (scenario: ScenarioDefinition) => {
    setSelectedScenario(scenario.type);
    setScenarioParams({ ...scenario.defaultParams });
    setAppliedLeverIds([]); // reset levers for new scenario
  };

  const handleParamChange = (key: string, value: any) => {
    setScenarioParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetParams = () => {
    const currentDef = SCENARIO_DEFINITIONS.find((s) => s.type === selectedScenario);
    if (currentDef) {
      setScenarioParams({ ...currentDef.defaultParams });
    }
  };

  // Run Stress Test calculation
  const handleExecuteStressTest = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const result = runStressTest(BASELINE_METRICS, selectedScenario, scenarioParams, appliedLeverIds);
      setTestResult(result);
      onUpdateStressedState(result);
      setIsCalculating(false);
    }, 400); // realistic computation micro-delay
  };

  // Toggle a recovery lever (Problem -> Action -> Recovery)
  const handleToggleLever = (leverId: string) => {
    const isCurrentlyApplied = appliedLeverIds.includes(leverId);
    const updated = isCurrentlyApplied
      ? appliedLeverIds.filter((id) => id !== leverId)
      : [...appliedLeverIds, leverId];

    setAppliedLeverIds(updated);

    // Instant recalculation to animate recovery
    setIsCalculating(true);
    setTimeout(() => {
      const result = runStressTest(BASELINE_METRICS, selectedScenario, scenarioParams, updated);
      setTestResult(result);
      onUpdateStressedState(result);
      setIsCalculating(false);
    }, 300);
  };

  const getScenarioIcon = (type: ScenarioType) => {
    switch (type) {
      case 'job_loss':
        return <Briefcase className="w-5 h-5" />;
      case 'rent_increase':
        return <Home className="w-5 h-5" />;
      case 'emergency_expense':
        return <AlertTriangle className="w-5 h-5" />;
      case 'income_boost':
        return <TrendingUp className="w-5 h-5" />;
      case 'cut_spending':
        return <Scissors className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Financial Twin Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            What-If Scenario Stress Testing
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate life disruptions, macroeconomic shocks, and cashflow volatility against your Financial Twin before they happen.
          </p>
        </div>

        {/* Quick jump to Copilot */}
        <button
          onClick={() => navigate('/copilot')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/50 hover:border-cyan-400 transition-all self-start shadow-glow-cyan"
        >
          <MessageSquareText className="w-4 h-4" />
          <span>Ask AI Copilot Diagnosis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. FINANCIAL TWIN BASELINE SECTION */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0c1524] via-[#0a101b] to-[#070b12] border border-surface-border p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Baseline State</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  ACTIVE TWIN: ALEX V.
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Current Financial Twin Baseline
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div>
              <span className="block text-slate-500">Gross Monthly Inflow:</span>
              <span className="font-mono font-bold text-slate-200 text-sm">₹{BASELINE_METRICS.monthlyIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="block text-slate-500">Fixed Overhead (Rent/EMI):</span>
              <span className="font-mono font-bold text-slate-200 text-sm">₹{BASELINE_METRICS.fixedExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="block text-slate-500">Discretionary Spend:</span>
              <span className="font-mono font-bold text-slate-200 text-sm">₹{BASELINE_METRICS.discretionaryExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Baseline 4 Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="rounded-2xl bg-surface/80 border border-surface-border p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Resilience Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-400">{BASELINE_METRICS.resilience}</span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: \`\${BASELINE_METRICS.resilience}%\` }} />
            </div>
          </div>

          <div className="rounded-2xl bg-surface/80 border border-surface-border p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Emergency Runway
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-mono text-slate-100">{BASELINE_METRICS.runwayMonths}</span>
              <span className="text-xs font-medium text-slate-400">months</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 font-medium block mt-2">
              Safe buffer (&gt; 6.0 mo)
            </span>
          </div>

          <div className="rounded-2xl bg-surface/80 border border-surface-border p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Monthly Savings
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
                ₹{(BASELINE_METRICS.monthlySavings / 1000).toFixed(0)}k
              </span>
              <span className="text-xs text-slate-400">/mo</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block mt-2">
              21.9% savings rate
            </span>
          </div>

          <div className="rounded-2xl bg-surface/80 border border-surface-border p-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Total Net Worth
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                ₹{(BASELINE_METRICS.netWorth / 100000).toFixed(2)}L
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block mt-2">
              ₹2.5L liquid + ₹3.5L inv
            </span>
          </div>
        </div>
      </section>

      {/* 2 & 3. SCENARIO SELECTION & CONTROLS */}
      <section className="space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Step 1: Choose Shock Event
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Interactive Scenario Selection
          </h2>
        </div>

        {/* 5 Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {SCENARIO_DEFINITIONS.map((s) => {
            const isSelected = selectedScenario === s.type;

            return (
              <button
                key={s.type}
                onClick={() => handleSelectScenario(s)}
                className={`text-left rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#132035] to-[#0d1624] border-emerald-400 shadow-glow-emerald scale-[1.02]'
                    : 'bg-surface-card border-surface-border hover:border-slate-600 hover:bg-surface-elevated'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-surface text-slate-400 group-hover:text-white'
                    }`}>
                      {getScenarioIcon(s.type)}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {s.shortDesc}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {isSelected ? 'Selected' : 'Click to Test'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Scenario Controls Panel */}
        <ScenarioControls
          scenarioType={selectedScenario}
          params={scenarioParams}
          onParamChange={handleParamChange}
          onResetParams={handleResetParams}
          onRunStressTest={handleExecuteStressTest}
          isCalculating={isCalculating}
        />
      </section>

      {/* 5. BEFORE / AFTER ANIMATED METRICS */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Deterministic Simulation Results
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>BEFORE</span>
              <span className="text-emerald-400">→</span>
              <span>AFTER STRESS IMPACT</span>
            </h2>
          </div>
          <span className="text-xs text-slate-400 bg-surface px-3 py-1.5 rounded-xl border border-surface-border self-start">
            Scenario: <strong className="text-white">{testResult.scenarioTitle}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Resilience Card */}
          <MetricCard
            label="Financial Resilience Score"
            beforeValue={testResult.before.resilience}
            afterValue={testResult.after.resilience}
            unit="/100"
            deltaText={`${testResult.after.resilience >= testResult.before.resilience ? '+' : ''}${testResult.after.resilience - testResult.before.resilience} pts`}
            isPositiveChange={testResult.after.resilience >= testResult.before.resilience}
            progressPercent={testResult.after.resilience}
            subtext={
              testResult.after.resilience >= 75
                ? 'Resilience remains in the safe zone.'
                : testResult.after.resilience >= 50
                ? 'Enters warning zone. Action recommended.'
                : 'Enters critical risk. Defensive actions required immediately.'
            }
          />

          {/* Runway Card */}
          <MetricCard
            label="Survival Emergency Runway"
            beforeValue={testResult.before.runwayMonths}
            afterValue={testResult.after.runwayMonths}
            unit=" mo"
            deltaText={`${(testResult.after.runwayMonths - testResult.before.runwayMonths).toFixed(1)} mo`}
            isPositiveChange={testResult.after.runwayMonths >= testResult.before.runwayMonths}
            subtext={`Liquid buffer available to absorb monthly expenditures.`}
          />

          {/* Monthly Savings Card */}
          <MetricCard
            label="Monthly Savings / Cashflow"
            beforeValue={testResult.before.monthlySavings}
            afterValue={testResult.after.monthlySavings}
            isCurrency={true}
            deltaText={`${testResult.after.monthlySavings >= testResult.before.monthlySavings ? '+' : ''}₹${(testResult.after.monthlySavings - testResult.before.monthlySavings).toLocaleString('en-IN')}`}
            isPositiveChange={testResult.after.monthlySavings >= testResult.before.monthlySavings}
            subtext={
              testResult.after.monthlySavings < 0
                ? `Negative cash burn: Depleting ₹${Math.abs(testResult.after.monthlySavings).toLocaleString('en-IN')} per month.`
                : `Net positive cashflow added to net worth.`
            }
          />
        </div>
      </section>

      {/* 6 & 7. SCENARIO VERDICT & TOP FACTORS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Verdict (2 cols) */}
        <div className={`lg:col-span-2 rounded-2xl p-6 sm:p-7 border backdrop-blur-sm shadow-xl flex flex-col justify-between ${
          testResult.verdictSeverity === 'critical'
            ? 'bg-rose-950/25 border-rose-500/40 shadow-glow-rose'
            : testResult.verdictSeverity === 'warning'
            ? 'bg-amber-950/20 border-amber-500/40 shadow-glow-amber'
            : 'bg-emerald-950/20 border-emerald-500/40 shadow-glow-emerald'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              {testResult.verdictSeverity === 'critical' ? (
                <AlertOctagon className="w-5 h-5 text-rose-400" />
              ) : testResult.verdictSeverity === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              <span className={`text-xs font-bold uppercase tracking-widest ${
                testResult.verdictSeverity === 'critical'
                  ? 'text-rose-400'
                  : testResult.verdictSeverity === 'warning'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                AI Diagnosis & Scenario Verdict
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight mb-2">
              Financial Twin Health Assessment
            </h3>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              "{testResult.verdict}"
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Diagnosed by deterministic simulation engine in <code className="text-slate-300 font-mono">lib/simulatorService.ts</code>
            </span>
            <button
              onClick={() => navigate('/copilot')}
              className="font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              <span>Consult Copilot for In-Depth Strategy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Factors (1 col) */}
        <div className="rounded-2xl bg-surface-card border border-surface-border p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Top Impact Factors</h3>
          </div>

          <div className="space-y-3">
            {testResult.topFactors.map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">{f.factor}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    f.isNegative ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {f.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. PROJECTION CHART */}
      <section>
        <ProjectionChart projections={testResult.projections} />
      </section>

      {/* 8. FUTURE TIMELINE */}
      <section>
        <TimelineView timeline={testResult.timeline} />
      </section>

      {/* 10. OPTIMIZATION / RECOVERY FLOW */}
      <section id="recovery-section">
        <RecoveryLevers
          levers={testResult.recoveryLevers}
          onToggleLever={handleToggleLever}
          appliedCount={appliedLeverIds.length}
        />
      </section>
    </div>
  );
};
`);

console.log('Step 10 complete: SimulatorPage');
// 11. src/routes/CopilotPage.tsx
write('src/routes/CopilotPage.tsx', `
import React, { useState, useRef, useEffect } from 'react';
import { 
  generateCopilotResponse, 
  SUGGESTED_QUESTIONS 
} from '../lib/copilotMock';
import { BASELINE_METRICS } from '../lib/simulatorService';
import { 
  CopilotMessage, 
  FinancialMetrics, 
  StressTestResult 
} from '../types/finance';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  HelpCircle, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  SlidersHorizontal,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface CopilotPageProps {
  navigate: (route: string) => void;
  metrics: FinancialMetrics;
  activeScenario: StressTestResult | null;
}

export const CopilotPage: React.FC<CopilotPageProps> = ({
  navigate,
  metrics,
  activeScenario,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    // Initial welcome message from copilot
    const initial = generateCopilotResponse('How healthy are my finances?', metrics, activeScenario);
    return [
      {
        id: 'welcome_1',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: \`Hello! I am **FinanceGuard Copilot**, your autonomous financial diagnostic intelligence.

I monitor your live **Financial Twin** (Resilience: **\${metrics.resilience}/100**, Runway: **\${metrics.runwayMonths} months**). Ask me any diagnostic question or pick from the suggested prompts below to analyze your stress resilience, purchasing decisions, or recovery options.\`,
        suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 4),
      },
    ];
  });

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isTyping) return;

    const userMsg: CopilotMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    // Realistic response delay
    setTimeout(() => {
      const response = generateCopilotResponse(query, metrics, activeScenario);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 450);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: \`Chat history reset. How can I assist with your **Financial Twin** today?\`,
        suggestedFollowUps: SUGGESTED_QUESTIONS,
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-widest">
            <Bot className="w-4 h-4" />
            <span>AI Financial Twin Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            FinanceGuard AI Copilot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deterministic diagnostic analysis and stress-test advisory powered by your real-time financial metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/simulator')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-slate-300 text-xs font-semibold hover:border-emerald-500/40 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulator</span>
          </button>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-surface-border text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Twin Snapshot Sidebar + Right Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Live Twin Context Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-surface-card border border-surface-border p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Live Twin Context</h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                SYNCED
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Resilience:</span>
                <span className="font-bold text-base text-emerald-400">{metrics.resilience}/100</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Emergency Runway:</span>
                <span className="font-bold text-white">{metrics.runwayMonths} months</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Monthly Savings:</span>
                <span className="font-bold text-emerald-300">₹{metrics.monthlySavings.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Net Worth:</span>
                <span className="font-bold text-white">₹{(metrics.netWorth / 100000).toFixed(2)}L</span>
              </div>
            </div>

            {/* Active Simulation Status if any */}
            {activeScenario && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Active Simulated Scenario:
                </span>
                <p className="font-semibold text-slate-200">{activeScenario.scenarioTitle}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Resilience shifted from {activeScenario.before.resilience} → {activeScenario.after.resilience}.
                </p>
              </div>
            )}
          </div>

          {/* Quick Suggested Questions Box */}
          <div className="rounded-2xl bg-surface-card border border-surface-border p-5 shadow-xl backdrop-blur-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suggested Questions</span>
            </h3>

            <div className="flex flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-xs p-2.5 rounded-xl bg-surface-elevated hover:bg-cyan-950/40 hover:border-cyan-500/40 border border-surface-border text-slate-300 hover:text-cyan-200 transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{q}</span>
                  <ChevronRightIcon className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chat Stream Container (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[680px] rounded-3xl bg-surface-card border border-surface-border shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-glow-cyan">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-sm space-y-3.5 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-tr-none shadow-lg'
                    : 'bg-[#0f1728] border border-surface-border text-slate-200 rounded-tl-none shadow-xl'
                }`}>
                  {/* Diagnosis Badge if present */}
                  {msg.diagnosisBadge && (
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        msg.diagnosisBadge.variant === 'safe'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : msg.diagnosisBadge.variant === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : msg.diagnosisBadge.variant === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {msg.diagnosisBadge.label}
                      </span>
                    </div>
                  )}

                  {/* Message Content with basic formatting */}
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2">
                    {msg.content.split('\n\n').map((para, pIdx) => {
                      if (para.startsWith('### ')) {
                        return <h4 key={pIdx} className="font-bold text-white text-sm mt-2 mb-1">{para.replace('### ', '')}</h4>;
                      }
                      if (para.startsWith('* ') || para.startsWith('1. ')) {
                        return (
                          <div key={pIdx} className="pl-2 space-y-1">
                            {para.split('\n').map((line, lIdx) => (
                              <div key={lIdx} className="text-slate-300">
                                {line}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p key={pIdx}>{para}</p>;
                    })}
                  </div>

                  {/* Metric Highlight Badges */}
                  {msg.metricsHighlight && msg.metricsHighlight.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      {msg.metricsHighlight.map((m, mIdx) => (
                        <div key={mIdx} className="p-2.5 rounded-xl bg-surface border border-surface-border font-mono text-xs">
                          <span className="text-[10px] text-slate-400 font-sans block">{m.label}</span>
                          <span className="font-bold text-slate-100">{m.value}</span>
                          {m.change && (
                            <span className={`text-[10px] block ${m.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {m.change}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Steps Checklist */}
                  {msg.actionSteps && msg.actionSteps.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-surface/80 border border-surface-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                        Recommended Immediate Steps:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {msg.actionSteps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Follow-ups */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((fUp, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendMessage(fUp)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors"
                        >
                          💬 {fUp}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 block text-right font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#0f1728] border border-surface-border text-slate-400 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>Diagnosing Financial Twin telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-surface-border bg-[#090d16]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask about your resilience, laptop purchase, emergency runway, or job loss..."
                className="flex-1 px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isTyping}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <span>Ask</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
`);

console.log('Step 11 complete: CopilotPage');
// 12. src/routes/HomePage.tsx
write('src/routes/HomePage.tsx', `
import React from 'react';
import { 
  ShieldCheck, 
  SlidersHorizontal, 
  MessageSquareText, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  ArrowRight, 
  Zap, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import { BASELINE_METRICS } from '../lib/simulatorService';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-glow-emerald">
          <Sparkles className="w-3.5 h-3.5" />
          <span>48-Hour Hackathon • Autonomous Financial Resilience Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Anticipate Financial Shocks with your <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Financial Twin</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          FinanceGuard stress-tests your finances against job loss, rent spikes, and emergencies — then prescribes deterministic recovery levers before crisis strikes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/simulator')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider hover:brightness-110 shadow-glow-emerald transition-all flex items-center justify-center gap-2.5 active:scale-95"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Launch What-If Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/copilot')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-surface border border-surface-border text-slate-200 font-bold text-sm hover:border-cyan-500/40 hover:bg-surface-elevated transition-all flex items-center justify-center gap-2.5"
          >
            <MessageSquareText className="w-5 h-5 text-cyan-400" />
            <span>Open AI Copilot</span>
          </button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Simulator Launcher Card */}
        <div 
          onClick={() => navigate('/simulator')}
          className="rounded-3xl bg-gradient-to-br from-[#0e1828] to-[#0a101b] border border-surface-border p-8 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <SlidersHorizontal className="w-6 h-6" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Core Module 01
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-emerald-300 transition-colors">
            What-If Scenario Simulator
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Simulate 5 deterministic shock scenarios (Job Loss, Rent Surge, Medical Shock, Discretionary Trim) with real-time Before/After diffs, 6-month timelines, and interactive recovery levers.
          </p>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Explore /simulator</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Copilot Launcher Card */}
        <div 
          onClick={() => navigate('/copilot')}
          className="rounded-3xl bg-gradient-to-br from-[#0a1727] to-[#070f1a] border border-surface-border p-8 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
            <MessageSquareText className="w-6 h-6" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
            Core Module 02
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-cyan-300 transition-colors">
            AI Twin Copilot & Diagnosis
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Query your Financial Twin for instant deterministic diagnosis: purchasing decisions (laptop affordability), runway survival calculations, resilience scoring, and benchmark targets.
          </p>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Explore /copilot</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Key Architecture Callout */}
      <section className="rounded-3xl bg-surface-card border border-surface-border p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-amber-400" />
          <h3 className="font-bold text-lg text-white">48-Hour Hackathon Architecture Isolation</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
            <span className="text-emerald-400 font-bold block mb-1 font-sans">1. Mock Financial Engine:</span>
            <code>lib/simulatorService.ts</code>
            <p className="text-slate-400 text-[11px] font-sans mt-1">
              Deterministic stress test formulas, runway calculations, 6-month timelines & recovery levers.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
            <span className="text-cyan-400 font-bold block mb-1 font-sans">2. Mock AI Diagnostic Copilot:</span>
            <code>lib/copilotMock.ts</code>
            <p className="text-slate-400 text-[11px] font-sans mt-1">
              Deterministic question-answer generation, purchase validation, and risk verdicts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
`);

// 13. src/App.tsx
write('src/App.tsx', `
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SimulatorPage } from './routes/SimulatorPage';
import { CopilotPage } from './routes/CopilotPage';
import { HomePage } from './routes/HomePage';
import { BASELINE_METRICS } from './lib/simulatorService';
import { FinancialMetrics, StressTestResult } from './types/finance';

export const App: React.FC = () => {
  // Simple client-side router
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    if (hash === '/simulator' || path === '/simulator') return '/simulator';
    if (hash === '/copilot' || path === '/copilot') return '/copilot';
    return '/';
  });

  const [activeScenario, setActiveScenario] = useState<StressTestResult | null>(null);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      if (hash === '/simulator' || path === '/simulator') setCurrentRoute('/simulator');
      else if (hash === '/copilot' || path === '/copilot') setCurrentRoute('/copilot');
      else setCurrentRoute('/');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const currentMetrics: FinancialMetrics = activeScenario ? activeScenario.after : BASELINE_METRICS;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        metrics={currentMetrics}
        isStressed={!!activeScenario}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentRoute === '/simulator' && (
          <SimulatorPage
            navigate={navigate}
            onUpdateStressedState={setActiveScenario}
            activeTestResult={activeScenario}
          />
        )}

        {currentRoute === '/copilot' && (
          <CopilotPage
            navigate={navigate}
            metrics={currentMetrics}
            activeScenario={activeScenario}
          />
        )}

        {currentRoute === '/' && (
          <HomePage navigate={navigate} />
        )}
      </main>

      <footer className="border-t border-surface-border/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FinanceGuard — 48h Hackathon Architecture (Person 3 Deliverable)</span>
          <span className="font-mono text-[11px] text-slate-600">
            Routes: /simulator • /copilot • Pure Deterministic Engine
          </span>
        </div>
      </footer>
    </div>
  );
};
`);

// 14. src/main.tsx
write('src/main.tsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

// 15. src/index.css
write('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-[#070b12] text-slate-100;
  }
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #090d16;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
`);

// Root level lib/ aliases for external import compatibility
write('lib/simulatorService.ts', `export * from '../src/lib/simulatorService';`);
write('lib/copilotMock.ts', `export * from '../src/lib/copilotMock';`);

console.log('All files written successfully!');
