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
      content: `Here is your **Financial Twin Diagnosis**:

Your overall Resilience Score is **${metrics.resilience}/100**, placing you in the **${isGood ? 'Strong Top 15%' : isModerate ? 'Moderate Caution Zone' : 'High Risk Bracket'}** of peer financial profiles.

### Core Vitals:
* **Emergency Runway**: \`${metrics.runwayMonths} months\` (Target: 6.0+ months) — ${metrics.runwayMonths >= 6 ? '✅ Well insulated against sudden shocks.' : '⚠️ Below optimal safety buffer.'}
* **Monthly Savings Surplus**: \`₹${metrics.monthlySavings.toLocaleString('en-IN')}/mo\` (${((metrics.monthlySavings / (metrics.monthlyIncome || 1)) * 100).toFixed(1)}% savings rate).
* **Liquid Safety Buffer**: \`₹${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` liquid cash.
* **Total Net Worth**: \`₹${metrics.netWorth.toLocaleString('en-IN')}\`.`,
      metricsHighlight: [
        { label: 'Resilience Score', value: `${metrics.resilience}/100`, positive: isGood },
        { label: 'Runway', value: `${metrics.runwayMonths} mo`, positive: metrics.runwayMonths >= 6 },
        { label: 'Monthly Surplus', value: `₹${metrics.monthlySavings.toLocaleString('en-IN')}`, positive: metrics.monthlySavings > 0 },
        { label: 'Net Worth', value: `₹${metrics.netWorth.toLocaleString('en-IN')}`, positive: true },
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
          label: `STRESS TEST DIAGNOSIS: ${activeScenario.scenarioTitle.toUpperCase()}`,
          variant: activeScenario.verdictSeverity,
        },
        content: `Your resilience score adjusted from **${activeScenario.before.resilience}** down to **${activeScenario.after.resilience}** due to the simulated **${activeScenario.scenarioTitle}** scenario.

### Primary Drivers of the Score Drop:
1. **${activeScenario.topFactors[0]?.factor || 'Cash Flow Contraction'}**: ${activeScenario.topFactors[0]?.impact || 'Negative balance'}
2. **${activeScenario.topFactors[1]?.factor || 'Runway Depletion'}**: ${activeScenario.topFactors[1]?.impact || 'Buffer reduced'}
3. **${activeScenario.topFactors[2]?.factor || 'Fixed Obligation Pressure'}**: ${activeScenario.topFactors[2]?.impact || 'Rigidity'}

> ${activeScenario.verdict}`,
        metricsHighlight: [
          { label: 'Pre-Stress Resilience', value: `${activeScenario.before.resilience}`, positive: true },
          { label: 'Stressed Resilience', value: `${activeScenario.after.resilience}`, change: `-${activeScenario.before.resilience - activeScenario.after.resilience}`, positive: false },
          { label: 'Stressed Runway', value: `${activeScenario.after.runwayMonths} mo`, change: `-${(activeScenario.before.runwayMonths - activeScenario.after.runwayMonths).toFixed(1)} mo`, positive: false },
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
      content: `In your baseline state, your score is **${metrics.resilience}/100**.

Financial resilience is computed across 4 core vectors:
1. **Savings Rate (35% weight)**: Current surplus is ₹${metrics.monthlySavings.toLocaleString('en-IN')}/mo (${((metrics.monthlySavings / metrics.monthlyIncome) * 100).toFixed(0)}% of income).
2. **Runway Ratio (40% weight)**: Liquid reserves cover ${metrics.runwayMonths} months of expenses.
3. **Fixed-to-Income Overhead (15% weight)**: Fixed costs (Rent + Utilities + EMIs) consume ${((metrics.fixedExpenses / metrics.monthlyIncome) * 100).toFixed(0)}% of earnings.
4. **Liquid vs Invested Net Worth (10% weight)**: Net worth buffer of ₹${metrics.netWorth.toLocaleString('en-IN')}.

If you run a stress test in **/simulator**, any drop is caused by cashflow deficit or runway contraction.`,
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
      content: `Here are 3 deterministic levers to elevate your Financial Resilience from **${metrics.resilience}** towards **95+**:

### 1. Discretionary Spending Optimization (Estimated: +6 to +8 pts)
* Cap dining out and discretionary subscriptions by ₹5,000/month.
* **Annual Impact**: Adds ₹60,000 directly to liquid emergency reserves.

### 2. Emergency Vault Expansion (Estimated: +5 to +7 pts)
* Expand liquid savings from \`₹${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` to \`₹4,92,000\` (full 6-month fixed expense coverage).
* **Runway Impact**: Extends total runway beyond 12+ months.

### 3. Secondary Cashflow Diversification (Estimated: +8 to +12 pts)
* Introduce a ₹10,000–₹15,000/month side retainer or skill monetization.
* **Shock Absorption**: Prevents negative monthly cash flow in the event of primary salary interruption.`,
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
      content: `### Diagnosis: **Yes, you can afford a ₹80,000 laptop**, but using your liquid cash all at once has tradeoffs.

* **Upfront Cash Purchase**:
  * Liquid Emergency Fund drops from \`₹${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` → \`₹${remainingFund.toLocaleString('en-IN')}\`.
  * Runway decreases from \`${metrics.runwayMonths} mo\` → \`${postRunway} mo\` *(Still safely above the 6-month minimum threshold)*.
  * Resilience Score impact: ~ -3 points temporary dip (from ${metrics.resilience} to ${metrics.resilience - 3}).

* **Zero-Interest / 3-Month Savings Route (Recommended)**:
  * At your current monthly surplus of \`₹${metrics.monthlySavings.toLocaleString('en-IN')}/mo\`, you will fully fund this purchase in **${monthsToSave} months** without touching emergency reserves!`,
      metricsHighlight: [
        { label: 'Purchase Cost', value: '₹80,000', positive: false },
        { label: 'Post-Buy Liquid Fund', value: `₹${remainingFund.toLocaleString('en-IN')}`, positive: true },
        { label: 'Post-Buy Runway', value: `${postRunway} months`, positive: postRunway >= 6 },
        { label: 'Months to Save', value: `${monthsToSave} months`, positive: true },
      ],
      actionSteps: [
        `Allocate ₹${Math.round(cost / 3).toLocaleString('en-IN')}/mo over the next 3 months to purchase cash-positive.`,
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
        label: `RUNWAY SIMULATION: ${runwayExact} MONTHS SURVIVAL BUFFER`,
        variant: runwayExact >= 6 ? 'warning' : 'critical',
      },
      content: `### If your primary income drops to ₹0 tomorrow:

1. **Pure Liquid Survival**:
   * With **₹${metrics.liquidEmergencyFund.toLocaleString('en-IN')}** in liquid reserves and **₹${monthlyBurn.toLocaleString('en-IN')}/month** burn, you have exactly **${runwayExact} months** before needing to liquidate investments or take loans.

2. **Total Liquidity (Liquid + Investments)**:
   * Total net worth of ₹${metrics.netWorth.toLocaleString('en-IN')} provides up to **${totalWithInvestments} months** of absolute runway.

3. **Emergency Defensive Action Plan**:
   * Cutting discretionary spending from ₹30,000 → ₹8,000 drops your burn rate from ₹82,000 → **₹60,000/mo**, expanding runway from \`${runwayExact} mo\` → **${Number((metrics.liquidEmergencyFund / 60000).toFixed(1))} months**!`,
      metricsHighlight: [
        { label: 'Monthly Burn', value: `₹${monthlyBurn.toLocaleString('en-IN')}/mo`, positive: false },
        { label: 'Pure Liquid Runway', value: `${runwayExact} months`, positive: runwayExact >= 6 },
        { label: 'Defensive Runway (Trimmed)', value: `${Number((metrics.liquidEmergencyFund / 60000).toFixed(1))} months`, positive: true },
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
      content: `### Recommended Emergency Fund Targets for Your Profile:

* **Tier 1 (Minimum Survival - 3 Months Fixed Costs)**: \`₹${target3Mo.toLocaleString('en-IN')}\` *(Covers rent, EMIs, groceries)*.
* **Tier 2 (Optimal Recommended - 6 Months Total Burn)**: \`₹${target6Mo.toLocaleString('en-IN')}\` ⭐ **(Your Target Benchmark)**.
* **Tier 3 (Bulletproof Independence - 12 Months)**: \`₹${target12Mo.toLocaleString('en-IN')}\`.

### Your Current Position:
* Current liquid buffer: \`₹${metrics.liquidEmergencyFund.toLocaleString('en-IN')}\` (${metrics.runwayMonths} months).
* **Gap to 6-Month Gold Standard**: \`₹${Math.max(0, target6Mo - metrics.liquidEmergencyFund).toLocaleString('en-IN')}\` remaining. At ₹23,000/mo savings, you can close this in **${Math.ceil(Math.max(0, target6Mo - metrics.liquidEmergencyFund) / metrics.monthlySavings)} months**.`,
      metricsHighlight: [
        { label: 'Current Buffer', value: `₹${metrics.liquidEmergencyFund.toLocaleString('en-IN')}`, positive: true },
        { label: '6-Month Target', value: `₹${target6Mo.toLocaleString('en-IN')}`, positive: true },
        { label: 'Current Coverage', value: `${metrics.runwayMonths} mo`, positive: true },
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

  // Fallback intelligent response
  return {
    id,
    sender: 'assistant',
    timestamp,
    diagnosisBadge: {
      label: 'FINANCIAL TWIN COPILOT ADVICE',
      variant: 'info',
    },
    content: `Based on your live **Financial Twin** parameters:

* **Resilience Score**: \`${metrics.resilience}/100\`
* **Runway**: \`${metrics.runwayMonths} months\`
* **Monthly Savings Surplus**: \`₹${metrics.monthlySavings.toLocaleString('en-IN')}\`
* **Net Worth**: \`₹${metrics.netWorth.toLocaleString('en-IN')}\`

For your query regarding **"${question}"**:
Your profile has a solid savings foundation. When planning large expenses or life transitions, maintain at least 6 months of liquid runway (\`₹${(metrics.monthlyExpenses * 6).toLocaleString('en-IN')}\`) and keep fixed recurring commitments below 50% of income.`,
    actionSteps: [
      'Simulate high-impact scenarios on the /simulator page to preview changes to your financial timeline.',
      'Select any suggested question below for immediate diagnostic breakdown.',
    ],
    suggestedFollowUps: [
      'How healthy are my finances?',
      'Why did my resilience drop?',
      'How can I improve it?',
    ],
  };
}
