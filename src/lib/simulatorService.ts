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
 * Represents the fictional user's current baseline state:
 * - Resilience: 82/100
 * - Runway: 10.8 months
 * - Monthly savings: ₹23,000
 * - Net worth: ₹6,00,000
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
  badge: string;
  defaultParams: Record<string, any>;
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    type: 'job_loss',
    title: 'Job Loss',
    shortDesc: 'Temporary or sudden loss of primary salary / client revenue',
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
    badge: 'Recurring Cost',
    defaultParams: {
      rentIncreaseAmount: 12000,
    },
  },
  {
    type: 'emergency_expense',
    title: 'Emergency Expense',
    shortDesc: 'Unplanned medical, vehicle, family, or critical appliance expenditure',
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

  let stressedIncome = baseline.monthlyIncome;
  let stressedExpenses = baseline.monthlyExpenses;
  let stressedLiquid = baseline.liquidEmergencyFund;
  let stressedNetWorth = baseline.netWorth;
  let stressedFixed = baseline.fixedExpenses;
  let stressedDiscretionary = baseline.discretionaryExpenses;

  let verdict = '';
  let verdictSeverity: 'safe' | 'warning' | 'critical' = 'safe';
  let topFactors: TopFactor[] = [];

  const levers = getRecommendedLeversForScenario(scenarioType, appliedLeverIds);

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
      
      const effectiveRunway = stressedExpenses > 0 ? Number((stressedLiquid / stressedExpenses).toFixed(1)) : 99;

      if (dropPct >= 0.8 && duration >= 3) {
        verdictSeverity = 'critical';
        verdict = `Your financial twin enters a critical warning state because the temporary income loss creates an immediate negative monthly cashflow of -₹${monthlyDeficit.toLocaleString('en-IN')}/mo, rapidly compressing your emergency runway from ${baseline.runwayMonths} months to ${effectiveRunway} months.`;
      } else {
        verdictSeverity = 'warning';
        verdict = `Your financial twin experiences moderate stress. Lowered income reduces your monthly savings to -₹${monthlyDeficit.toLocaleString('en-IN')}, drawing down ₹${totalDrawdown.toLocaleString('en-IN')} over ${duration} months.`;
      }

      topFactors = [
        {
          factor: 'Primary Salary Disruption',
          impact: `-${(dropPct * 100).toFixed(0)}% Income Loss`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Monthly Cash Burn',
          impact: `-₹${monthlyDeficit.toLocaleString('en-IN')}/month`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Emergency Runway Compression',
          impact: `-${(baseline.runwayMonths - effectiveRunway).toFixed(1)} months`,
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
        verdict = `A ₹${rentInc.toLocaleString('en-IN')}/mo rent escalation severely erodes your monthly surplus, dropping your savings rate down to ₹${newSavings.toLocaleString('en-IN')}/mo and increasing fixed cost rigidity.`;
      } else {
        verdictSeverity = 'warning';
        verdict = `The rent increase reduces your monthly savings surplus from ₹${baseline.monthlySavings.toLocaleString('en-IN')} down to ₹${newSavings.toLocaleString('en-IN')}, moderately diminishing annual wealth accumulation.`;
      }

      topFactors = [
        {
          factor: 'Fixed Housing Obligation Surge',
          impact: `+₹${rentInc.toLocaleString('en-IN')}/month`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Monthly Savings Shrinkage',
          impact: `-₹${rentInc.toLocaleString('en-IN')}/month`,
          isNegative: true,
          severity: 'medium',
        },
        {
          factor: 'Fixed-to-Income Ratio',
          impact: `${((stressedFixed / stressedIncome) * 100).toFixed(0)}% of income`,
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
        verdict = `A sudden ₹${expAmount.toLocaleString('en-IN')} emergency shock depletes ${((expAmount / baseline.liquidEmergencyFund) * 100).toFixed(0)}% of your liquid safety buffer, leaving only ${newRunway} months of emergency runway.`;
      } else {
        verdictSeverity = 'warning';
        verdict = `The ₹${expAmount.toLocaleString('en-IN')} one-off expense was absorbed by your emergency reserves. While your net worth dropped, your positive monthly cash flow of ₹${baseline.monthlySavings.toLocaleString('en-IN')} remains intact to rebuild.`;
      }

      topFactors = [
        {
          factor: 'Liquid Reserve Depletion',
          impact: `-₹${expAmount.toLocaleString('en-IN')} cash`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Runway Reduction',
          impact: `-${(baseline.runwayMonths - newRunway).toFixed(1)} months`,
          isNegative: true,
          severity: 'high',
        },
        {
          factor: 'Cash Flow Protection',
          impact: `₹${baseline.monthlySavings.toLocaleString('en-IN')}/mo sustained`,
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
      verdict = `Your financial twin experiences significant positive resilience growth! The ₹${boost.toLocaleString('en-IN')}/month boost accelerates your monthly savings surplus to ₹${(baseline.monthlySavings + boost).toLocaleString('en-IN')} and expands emergency runway.`;

      topFactors = [
        {
          factor: 'Revenue Expansion',
          impact: `+₹${boost.toLocaleString('en-IN')}/month`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Enhanced Savings Rate',
          impact: `${(((baseline.monthlySavings + boost) / stressedIncome) * 100).toFixed(0)}% of gross`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Runway Expansion',
          impact: `+${((stressedLiquid / stressedExpenses) - baseline.runwayMonths).toFixed(1)} months`,
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
      verdict = `Optimizing discretionary spending frees up ₹${cut.toLocaleString('en-IN')}/month, expanding your savings rate to ₹${(baseline.monthlySavings + cut).toLocaleString('en-IN')} and boosting your resilience score.`;

      topFactors = [
        {
          factor: 'Discretionary Trim',
          impact: `-₹${cut.toLocaleString('en-IN')}/month cost`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Monthly Savings Boost',
          impact: `+₹${cut.toLocaleString('en-IN')}/month`,
          isNegative: false,
          severity: 'low',
        },
        {
          factor: 'Runway Cushion',
          impact: `+${((stressedLiquid / stressedExpenses) - baseline.runwayMonths).toFixed(1)} months`,
          isNegative: false,
          severity: 'low',
        },
      ];
      break;
    }
  }

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

  finalResilience = Math.min(100, Math.max(12, finalResilience + totalResilienceBonus));

  if (appliedLeverIds.length > 0) {
    verdict += ` 🚀 Recovery actions active: Applied ${appliedLeverIds.length} lever(s) restoring +₹${totalMonthlyRecovery.toLocaleString('en-IN')}/mo cashflow and lifting Resilience by +${totalResilienceBonus} pts.`;
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

  const monthNames = ['Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027'];
  const timeline: TimelineMonth[] = [];
  const projections: ProjectionPoint[] = [];

  let runningNetWorth = afterMetrics.netWorth;
  let runningLiquid = afterMetrics.liquidEmergencyFund;

  for (let i = 0; i < 6; i++) {
    const mName = monthNames[i];
    
    const bNet = baseline.netWorth + baseline.monthlySavings * (i + 1);
    const bRunway = baseline.runwayMonths + (i * 0.1);
    const bRes = Math.min(100, baseline.resilience + (i > 3 ? 1 : 0));

    runningNetWorth += afterMetrics.monthlySavings;
    if (afterMetrics.monthlySavings < 0) {
      runningLiquid = Math.max(0, runningLiquid + afterMetrics.monthlySavings);
    } else {
      runningLiquid += afterMetrics.monthlySavings * 0.5;
    }

    const mRunway = afterMetrics.monthlyExpenses > 0 ? Number((runningLiquid / afterMetrics.monthlyExpenses).toFixed(1)) : 0;
    
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
      mNote = `Severe cash burn of ₹${Math.abs(afterMetrics.monthlySavings).toLocaleString('en-IN')}/mo`;
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
