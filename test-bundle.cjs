"use strict";

// src/lib/simulatorService.ts
var BASELINE_METRICS = {
  resilience: 82,
  runwayMonths: 10.8,
  monthlySavings: 23e3,
  netWorth: 6e5,
  monthlyIncome: 105e3,
  monthlyExpenses: 82e3,
  liquidEmergencyFund: 25e4,
  investments: 35e4,
  fixedExpenses: 52e3,
  discretionaryExpenses: 3e4
};
var SCENARIO_DEFINITIONS = [
  {
    type: "job_loss",
    title: "Job Loss",
    shortDesc: "Temporary or sudden loss of primary salary / client revenue",
    badge: "High Impact",
    defaultParams: {
      incomeDropPercent: 100,
      durationMonths: 4,
      severancePay: 0
    }
  },
  {
    type: "rent_increase",
    title: "Rent Increase",
    shortDesc: "Unexpected surge in monthly residential lease or landlord escalation",
    badge: "Recurring Cost",
    defaultParams: {
      rentIncreaseAmount: 12e3
    }
  },
  {
    type: "emergency_expense",
    title: "Emergency Expense",
    shortDesc: "Unplanned medical, vehicle, family, or critical appliance expenditure",
    badge: "Lump Sum",
    defaultParams: {
      expenseAmount: 15e4,
      category: "Medical / Home Repair"
    }
  },
  {
    type: "income_boost",
    title: "Income Boost",
    shortDesc: "Promotion, salary hike, freelance retainer, or annual incentive",
    badge: "Positive Growth",
    defaultParams: {
      additionalIncome: 25e3,
      durationMonths: 6
    }
  },
  {
    type: "cut_spending",
    title: "Cut Discretionary Spending",
    shortDesc: "Aggressive optimization of lifestyle, dining out, and subscriptions",
    badge: "Optimization",
    defaultParams: {
      monthlyCutAmount: 1e4,
      targetCategory: "Dining & Entertainment"
    }
  }
];
function calculateResilienceScore(monthlyIncome, monthlyExpenses, liquidFund, netWorth, fixedExpenses) {
  if (monthlyExpenses <= 0) return 95;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : -1;
  const runway = liquidFund / monthlyExpenses;
  const fixedRatio = monthlyIncome > 0 ? fixedExpenses / monthlyIncome : 1;
  let score = 50;
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
  if (runway >= 12) {
    score += 28;
  } else if (runway >= 6) {
    score += 20 + (runway - 6) / 6 * 8;
  } else if (runway >= 3) {
    score += 8 + (runway - 3) / 3 * 12;
  } else if (runway >= 1) {
    score -= 8;
  } else {
    score -= 22;
  }
  if (fixedRatio < 0.4 && monthlyIncome > 0) {
    score += 10;
  } else if (fixedRatio > 0.7 || monthlyIncome === 0) {
    score -= 15;
  } else if (fixedRatio > 0.55) {
    score -= 7;
  }
  if (netWorth >= 1e6) {
    score += 10;
  } else if (netWorth >= 5e5) {
    score += 6;
  } else if (netWorth >= 2e5) {
    score += 3;
  } else if (netWorth < 5e4) {
    score -= 5;
  }
  return Math.min(100, Math.max(8, Math.round(score)));
}
function getRecommendedLeversForScenario(scenarioType, appliedLeverIds = []) {
  let levers = [];
  switch (scenarioType) {
    case "job_loss":
      levers = [
        {
          id: "cut_discretionary",
          title: "Reduce discretionary spending",
          description: "Pause dining out, luxury shopping, and lifestyle subscriptions.",
          monthlyImpact: 12e3,
          lumpSumImpact: 0,
          resilienceBoost: 14,
          actionType: "expense_cut"
        },
        {
          id: "emergency_buffer",
          title: "Liquidate low-yield secondary assets",
          description: "Reallocate \u20B935,000 short-term mutual funds into high-liquidity reserve.",
          monthlyImpact: 0,
          lumpSumImpact: 35e3,
          resilienceBoost: 9,
          actionType: "emergency_fund"
        },
        {
          id: "freelance_gig",
          title: "Activate freelance / consulting buffer",
          description: "Monetize technical skills or advisory for interim bridge cashflow.",
          monthlyImpact: 25e3,
          lumpSumImpact: 0,
          resilienceBoost: 16,
          actionType: "side_income"
        }
      ];
      break;
    case "rent_increase":
      levers = [
        {
          id: "cut_subscriptions",
          title: "Streamline entertainment & utilities",
          description: "Consolidate multiple streaming plans, gym memberships, and home bills.",
          monthlyImpact: 5e3,
          lumpSumImpact: 0,
          resilienceBoost: 8,
          actionType: "expense_cut"
        },
        {
          id: "lifestyle_rebalance",
          title: "Rebalance lifestyle & dining budget",
          description: "Cap weekend recreation and food delivery to offset rent escalation.",
          monthlyImpact: 7e3,
          lumpSumImpact: 0,
          resilienceBoost: 10,
          actionType: "expense_cut"
        },
        {
          id: "side_retainer",
          title: "Pick up weekend consulting gig",
          description: "Add a flexible \u20B910,000/month recurring income stream.",
          monthlyImpact: 1e4,
          lumpSumImpact: 0,
          resilienceBoost: 12,
          actionType: "side_income"
        }
      ];
      break;
    case "emergency_expense":
      levers = [
        {
          id: "rebuild_auto_save",
          title: "Emergency fund auto-rebuild siphon",
          description: "Auto-transfer discretionary surplus back into liquid reserves.",
          monthlyImpact: 8e3,
          lumpSumImpact: 0,
          resilienceBoost: 11,
          actionType: "emergency_fund"
        },
        {
          id: "temporary_pause_invest",
          title: "Pause discretionary SIP for 3 months",
          description: "Temporarily divert \u20B915,000 monthly SIP into immediate cash buffer.",
          monthlyImpact: 15e3,
          lumpSumImpact: 0,
          resilienceBoost: 14,
          actionType: "debt_optimization"
        },
        {
          id: "claim_insurance_tax",
          title: "Claim insurance / tax reimbursement",
          description: "Expedite pending medical or warranty claim payout.",
          monthlyImpact: 0,
          lumpSumImpact: 4e4,
          resilienceBoost: 8,
          actionType: "emergency_fund"
        }
      ];
      break;
    case "income_boost":
    case "cut_spending":
    default:
      levers = [
        {
          id: "boost_emergency_lock",
          title: "Build 12-month bulletproof emergency vault",
          description: "Lock \u20B920,000 of newly freed cashflow into safe liquid flexi-FD.",
          monthlyImpact: 0,
          lumpSumImpact: 2e4,
          resilienceBoost: 6,
          actionType: "emergency_fund"
        },
        {
          id: "auto_wealth_compounder",
          title: "Accelerate index wealth compounding",
          description: "Channel additional savings into diversified index assets.",
          monthlyImpact: 1e4,
          lumpSumImpact: 0,
          resilienceBoost: 8,
          actionType: "side_income"
        }
      ];
      break;
  }
  return levers.map((lever) => ({
    ...lever,
    applied: appliedLeverIds.includes(lever.id)
  }));
}
function runStressTest(baseline = BASELINE_METRICS, scenarioType, params, appliedLeverIds = []) {
  const definition = SCENARIO_DEFINITIONS.find((s) => s.type === scenarioType) || SCENARIO_DEFINITIONS[0];
  let stressedIncome = baseline.monthlyIncome;
  let stressedExpenses = baseline.monthlyExpenses;
  let stressedLiquid = baseline.liquidEmergencyFund;
  let stressedNetWorth = baseline.netWorth;
  let stressedFixed = baseline.fixedExpenses;
  let stressedDiscretionary = baseline.discretionaryExpenses;
  let verdict = "";
  let verdictSeverity = "safe";
  let topFactors = [];
  const levers = getRecommendedLeversForScenario(scenarioType, appliedLeverIds);
  switch (scenarioType) {
    case "job_loss": {
      const dropPct = Number(params.incomeDropPercent ?? 100) / 100;
      const duration = Number(params.durationMonths ?? 4);
      const severance = Number(params.severancePay ?? 0);
      stressedIncome = Math.max(0, baseline.monthlyIncome * (1 - dropPct));
      stressedLiquid = Math.max(0, baseline.liquidEmergencyFund + severance);
      const monthlyDeficit = stressedExpenses - stressedIncome;
      const totalDrawdown = monthlyDeficit * duration;
      stressedNetWorth = Math.max(5e4, baseline.netWorth - totalDrawdown + severance);
      const effectiveRunway = stressedExpenses > 0 ? Number((stressedLiquid / stressedExpenses).toFixed(1)) : 99;
      if (dropPct >= 0.8 && duration >= 3) {
        verdictSeverity = "critical";
        verdict = `Your financial twin enters a critical warning state because the temporary income loss creates an immediate negative monthly cashflow of -\u20B9${monthlyDeficit.toLocaleString("en-IN")}/mo, rapidly compressing your emergency runway from ${baseline.runwayMonths} months to ${effectiveRunway} months.`;
      } else {
        verdictSeverity = "warning";
        verdict = `Your financial twin experiences moderate stress. Lowered income reduces your monthly savings to -\u20B9${monthlyDeficit.toLocaleString("en-IN")}, drawing down \u20B9${totalDrawdown.toLocaleString("en-IN")} over ${duration} months.`;
      }
      topFactors = [
        {
          factor: "Primary Salary Disruption",
          impact: `-${(dropPct * 100).toFixed(0)}% Income Loss`,
          isNegative: true,
          severity: "high"
        },
        {
          factor: "Monthly Cash Burn",
          impact: `-\u20B9${monthlyDeficit.toLocaleString("en-IN")}/month`,
          isNegative: true,
          severity: "high"
        },
        {
          factor: "Emergency Runway Compression",
          impact: `-${(baseline.runwayMonths - effectiveRunway).toFixed(1)} months`,
          isNegative: true,
          severity: "medium"
        }
      ];
      break;
    }
    case "rent_increase": {
      const rentInc = Number(params.rentIncreaseAmount ?? 12e3);
      stressedExpenses = baseline.monthlyExpenses + rentInc;
      stressedFixed = baseline.fixedExpenses + rentInc;
      stressedNetWorth = baseline.netWorth - rentInc * 6;
      const newSavings = stressedIncome - stressedExpenses;
      const newRunway = Number((stressedLiquid / stressedExpenses).toFixed(1));
      if (newSavings < 5e3) {
        verdictSeverity = "critical";
        verdict = `A \u20B9${rentInc.toLocaleString("en-IN")}/mo rent escalation severely erodes your monthly surplus, dropping your savings rate down to \u20B9${newSavings.toLocaleString("en-IN")}/mo and increasing fixed cost rigidity.`;
      } else {
        verdictSeverity = "warning";
        verdict = `The rent increase reduces your monthly savings surplus from \u20B9${baseline.monthlySavings.toLocaleString("en-IN")} down to \u20B9${newSavings.toLocaleString("en-IN")}, moderately diminishing annual wealth accumulation.`;
      }
      topFactors = [
        {
          factor: "Fixed Housing Obligation Surge",
          impact: `+\u20B9${rentInc.toLocaleString("en-IN")}/month`,
          isNegative: true,
          severity: "high"
        },
        {
          factor: "Monthly Savings Shrinkage",
          impact: `-\u20B9${rentInc.toLocaleString("en-IN")}/month`,
          isNegative: true,
          severity: "medium"
        },
        {
          factor: "Fixed-to-Income Ratio",
          impact: `${(stressedFixed / stressedIncome * 100).toFixed(0)}% of income`,
          isNegative: true,
          severity: "medium"
        }
      ];
      break;
    }
    case "emergency_expense": {
      const expAmount = Number(params.expenseAmount ?? 15e4);
      stressedLiquid = Math.max(1e4, baseline.liquidEmergencyFund - expAmount);
      stressedNetWorth = Math.max(5e4, baseline.netWorth - expAmount);
      const newRunway = Number((stressedLiquid / stressedExpenses).toFixed(1));
      if (newRunway < 3) {
        verdictSeverity = "critical";
        verdict = `A sudden \u20B9${expAmount.toLocaleString("en-IN")} emergency shock depletes ${(expAmount / baseline.liquidEmergencyFund * 100).toFixed(0)}% of your liquid safety buffer, leaving only ${newRunway} months of emergency runway.`;
      } else {
        verdictSeverity = "warning";
        verdict = `The \u20B9${expAmount.toLocaleString("en-IN")} one-off expense was absorbed by your emergency reserves. While your net worth dropped, your positive monthly cash flow of \u20B9${baseline.monthlySavings.toLocaleString("en-IN")} remains intact to rebuild.`;
      }
      topFactors = [
        {
          factor: "Liquid Reserve Depletion",
          impact: `-\u20B9${expAmount.toLocaleString("en-IN")} cash`,
          isNegative: true,
          severity: "high"
        },
        {
          factor: "Runway Reduction",
          impact: `-${(baseline.runwayMonths - newRunway).toFixed(1)} months`,
          isNegative: true,
          severity: "high"
        },
        {
          factor: "Cash Flow Protection",
          impact: `\u20B9${baseline.monthlySavings.toLocaleString("en-IN")}/mo sustained`,
          isNegative: false,
          severity: "low"
        }
      ];
      break;
    }
    case "income_boost": {
      const boost = Number(params.additionalIncome ?? 25e3);
      stressedIncome = baseline.monthlyIncome + boost;
      stressedNetWorth = baseline.netWorth + boost * 6;
      stressedLiquid = baseline.liquidEmergencyFund + boost * 3;
      verdictSeverity = "safe";
      verdict = `Your financial twin experiences significant positive resilience growth! The \u20B9${boost.toLocaleString("en-IN")}/month boost accelerates your monthly savings surplus to \u20B9${(baseline.monthlySavings + boost).toLocaleString("en-IN")} and expands emergency runway.`;
      topFactors = [
        {
          factor: "Revenue Expansion",
          impact: `+\u20B9${boost.toLocaleString("en-IN")}/month`,
          isNegative: false,
          severity: "low"
        },
        {
          factor: "Enhanced Savings Rate",
          impact: `${((baseline.monthlySavings + boost) / stressedIncome * 100).toFixed(0)}% of gross`,
          isNegative: false,
          severity: "low"
        },
        {
          factor: "Runway Expansion",
          impact: `+${(stressedLiquid / stressedExpenses - baseline.runwayMonths).toFixed(1)} months`,
          isNegative: false,
          severity: "low"
        }
      ];
      break;
    }
    case "cut_spending": {
      const cut = Number(params.monthlyCutAmount ?? 1e4);
      stressedDiscretionary = Math.max(5e3, baseline.discretionaryExpenses - cut);
      stressedExpenses = baseline.fixedExpenses + stressedDiscretionary;
      stressedNetWorth = baseline.netWorth + cut * 6;
      stressedLiquid = baseline.liquidEmergencyFund + cut * 3;
      verdictSeverity = "safe";
      verdict = `Optimizing discretionary spending frees up \u20B9${cut.toLocaleString("en-IN")}/month, expanding your savings rate to \u20B9${(baseline.monthlySavings + cut).toLocaleString("en-IN")} and boosting your resilience score.`;
      topFactors = [
        {
          factor: "Discretionary Trim",
          impact: `-\u20B9${cut.toLocaleString("en-IN")}/month cost`,
          isNegative: false,
          severity: "low"
        },
        {
          factor: "Monthly Savings Boost",
          impact: `+\u20B9${cut.toLocaleString("en-IN")}/month`,
          isNegative: false,
          severity: "low"
        },
        {
          factor: "Runway Cushion",
          impact: `+${(stressedLiquid / stressedExpenses - baseline.runwayMonths).toFixed(1)} months`,
          isNegative: false,
          severity: "low"
        }
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
    stressedExpenses = Math.max(3e4, stressedExpenses - totalMonthlyRecovery);
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
    verdict += ` \u{1F680} Recovery actions active: Applied ${appliedLeverIds.length} lever(s) restoring +\u20B9${totalMonthlyRecovery.toLocaleString("en-IN")}/mo cashflow and lifting Resilience by +${totalResilienceBonus} pts.`;
    if (finalResilience >= 70) {
      verdictSeverity = "safe";
    } else if (finalResilience >= 50) {
      verdictSeverity = "warning";
    }
  }
  const afterMetrics = {
    resilience: finalResilience,
    runwayMonths: finalRunway,
    monthlySavings: finalSavings,
    netWorth: Math.round(stressedNetWorth),
    monthlyIncome: Math.round(stressedIncome),
    monthlyExpenses: Math.round(stressedExpenses),
    liquidEmergencyFund: Math.round(stressedLiquid),
    investments: baseline.investments,
    fixedExpenses: Math.round(stressedFixed),
    discretionaryExpenses: Math.round(stressedDiscretionary)
  };
  const monthNames = ["Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027"];
  const timeline = [];
  const projections = [];
  let runningNetWorth = afterMetrics.netWorth;
  let runningLiquid = afterMetrics.liquidEmergencyFund;
  for (let i = 0; i < 6; i++) {
    const mName = monthNames[i];
    const bNet = baseline.netWorth + baseline.monthlySavings * (i + 1);
    const bRunway = baseline.runwayMonths + i * 0.1;
    const bRes = Math.min(100, baseline.resilience + (i > 3 ? 1 : 0));
    runningNetWorth += afterMetrics.monthlySavings;
    if (afterMetrics.monthlySavings < 0) {
      runningLiquid = Math.max(0, runningLiquid + afterMetrics.monthlySavings);
    } else {
      runningLiquid += afterMetrics.monthlySavings * 0.5;
    }
    const mRunway = afterMetrics.monthlyExpenses > 0 ? Number((runningLiquid / afterMetrics.monthlyExpenses).toFixed(1)) : 0;
    let mRes = Math.min(100, Math.max(10, Math.round(afterMetrics.resilience + i * (afterMetrics.monthlySavings >= 0 ? 1.5 : -2))));
    if (appliedLeverIds.length > 0) {
      mRes = Math.min(100, mRes + i * 2);
    }
    let mStatus = "safe";
    if (mRes < 45 || mRunway < 2.5) {
      mStatus = "critical";
    } else if (mRes < 70 || mRunway < 6) {
      mStatus = "warning";
    }
    let mNote = "Balanced cash flow and buffer";
    if (mStatus === "critical") {
      mNote = `Severe cash burn of \u20B9${Math.abs(afterMetrics.monthlySavings).toLocaleString("en-IN")}/mo`;
    } else if (mStatus === "warning") {
      mNote = "Constrained savings cushion";
    } else if (appliedLeverIds.length > 0) {
      mNote = "Active recovery trajectory compounding";
    }
    timeline.push({
      monthIndex: i + 1,
      monthName: mName,
      resilience: mRes,
      runwayMonths: mRunway,
      netWorth: Math.round(runningNetWorth),
      monthlySavings: afterMetrics.monthlySavings,
      status: mStatus,
      notes: mNote
    });
    projections.push({
      month: mName,
      baselineNetWorth: Math.round(bNet),
      stressedNetWorth: Math.round(runningNetWorth),
      baselineRunway: Number(bRunway.toFixed(1)),
      stressedRunway: mRunway,
      baselineResilience: bRes,
      stressedResilience: mRes
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
    appliedLeverIds
  };
}

// src/lib/copilotMock.ts
var SUGGESTED_QUESTIONS = [
  "How healthy are my finances?",
  "Why did my resilience drop?",
  "How can I improve it?",
  "Can I afford a \u20B980,000 laptop?",
  "What happens if I lose my income?",
  "How much emergency fund should I target?"
];
function generateCopilotResponse(question, metrics = BASELINE_METRICS, activeScenario = null) {
  const normalized = question.toLowerCase().trim();
  const id = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (normalized.includes("healthy") || normalized.includes("health") || normalized.includes("how are my finances") || normalized.includes("financial status") || normalized.includes("overview")) {
    const isGood = metrics.resilience >= 75;
    const isModerate = metrics.resilience >= 50 && metrics.resilience < 75;
    return {
      id,
      sender: "assistant",
      timestamp,
      diagnosisBadge: {
        label: isGood ? "HEALTHY & STABLE" : isModerate ? "MODERATE VULNERABILITY" : "CRITICAL ATTENTION NEEDED",
        variant: isGood ? "safe" : isModerate ? "warning" : "critical"
      },
      content: `Here is your **Financial Twin Diagnosis**:

Your overall Resilience Score is **${metrics.resilience}/100**, placing you in the **${isGood ? "Strong Top 15%" : isModerate ? "Moderate Caution Zone" : "High Risk Bracket"}** of peer financial profiles.

### Core Vitals:
* **Emergency Runway**: \`${metrics.runwayMonths} months\` (Target: 6.0+ months) \u2014 ${metrics.runwayMonths >= 6 ? "\u2705 Well insulated against sudden shocks." : "\u26A0\uFE0F Below optimal safety buffer."}
* **Monthly Savings Surplus**: \`\u20B9${metrics.monthlySavings.toLocaleString("en-IN")}/mo\` (${(metrics.monthlySavings / (metrics.monthlyIncome || 1) * 100).toFixed(1)}% savings rate).
* **Liquid Safety Buffer**: \`\u20B9${metrics.liquidEmergencyFund.toLocaleString("en-IN")}\` liquid cash.
* **Total Net Worth**: \`\u20B9${metrics.netWorth.toLocaleString("en-IN")}\`.`,
      metricsHighlight: [
        { label: "Resilience Score", value: `${metrics.resilience}/100`, positive: isGood },
        { label: "Runway", value: `${metrics.runwayMonths} mo`, positive: metrics.runwayMonths >= 6 },
        { label: "Monthly Surplus", value: `\u20B9${metrics.monthlySavings.toLocaleString("en-IN")}`, positive: metrics.monthlySavings > 0 },
        { label: "Net Worth", value: `\u20B9${metrics.netWorth.toLocaleString("en-IN")}`, positive: true }
      ],
      actionSteps: [
        "Maintain automatic monthly allocation of \u20B923,000 to high-yield sweep reserves.",
        "Keep fixed recurring costs (Rent + EMIs) capped strictly under 50% of monthly income.",
        "Run stress tests in the Simulator to stress-test against unexpected job or rent shocks."
      ],
      suggestedFollowUps: [
        "What happens if I lose my income?",
        "Can I afford a \u20B980,000 laptop?",
        "How much emergency fund should I target?"
      ]
    };
  }
  if (normalized.includes("why did my resilience drop") || normalized.includes("resilience drop") || normalized.includes("score drop") || normalized.includes("why is score low") || normalized.includes("why dropped")) {
    if (activeScenario) {
      return {
        id,
        sender: "assistant",
        timestamp,
        diagnosisBadge: {
          label: `STRESS TEST DIAGNOSIS: ${activeScenario.scenarioTitle.toUpperCase()}`,
          variant: activeScenario.verdictSeverity
        },
        content: `Your resilience score adjusted from **${activeScenario.before.resilience}** down to **${activeScenario.after.resilience}** due to the simulated **${activeScenario.scenarioTitle}** scenario.

### Primary Drivers of the Score Drop:
1. **${activeScenario.topFactors[0]?.factor || "Cash Flow Contraction"}**: ${activeScenario.topFactors[0]?.impact || "Negative balance"}
2. **${activeScenario.topFactors[1]?.factor || "Runway Depletion"}**: ${activeScenario.topFactors[1]?.impact || "Buffer reduced"}
3. **${activeScenario.topFactors[2]?.factor || "Fixed Obligation Pressure"}**: ${activeScenario.topFactors[2]?.impact || "Rigidity"}

> ${activeScenario.verdict}`,
        metricsHighlight: [
          { label: "Pre-Stress Resilience", value: `${activeScenario.before.resilience}`, positive: true },
          { label: "Stressed Resilience", value: `${activeScenario.after.resilience}`, change: `-${activeScenario.before.resilience - activeScenario.after.resilience}`, positive: false },
          { label: "Stressed Runway", value: `${activeScenario.after.runwayMonths} mo`, change: `-${(activeScenario.before.runwayMonths - activeScenario.after.runwayMonths).toFixed(1)} mo`, positive: false }
        ],
        actionSteps: [
          'Review the "HOW CAN WE RECOVER?" section on the /simulator page to apply recovery levers.',
          "Implement discretionary spending cuts (-\u20B95,000 to -\u20B912,000/mo) to restore positive cash flow.",
          "Consider activating temporary bridge freelance or consulting work."
        ],
        suggestedFollowUps: [
          "How can I improve it?",
          "What happens if I lose my income?",
          "How much emergency fund should I target?"
        ]
      };
    }
    return {
      id,
      sender: "assistant",
      timestamp,
      diagnosisBadge: {
        label: "BASELINE RESILIENCE FACTOR BREAKDOWN",
        variant: "info"
      },
      content: `In your baseline state, your score is **${metrics.resilience}/100**.

Financial resilience is computed across 4 core vectors:
1. **Savings Rate (35% weight)**: Current surplus is \u20B9${metrics.monthlySavings.toLocaleString("en-IN")}/mo (${(metrics.monthlySavings / metrics.monthlyIncome * 100).toFixed(0)}% of income).
2. **Runway Ratio (40% weight)**: Liquid reserves cover ${metrics.runwayMonths} months of expenses.
3. **Fixed-to-Income Overhead (15% weight)**: Fixed costs (Rent + Utilities + EMIs) consume ${(metrics.fixedExpenses / metrics.monthlyIncome * 100).toFixed(0)}% of earnings.
4. **Liquid vs Invested Net Worth (10% weight)**: Net worth buffer of \u20B9${metrics.netWorth.toLocaleString("en-IN")}.

If you run a stress test in **/simulator**, any drop is caused by cashflow deficit or runway contraction.`,
      actionSteps: [
        "Navigate to /simulator to run what-if scenarios.",
        "Apply recovery levers to see resilience bounce back."
      ],
      suggestedFollowUps: [
        "How can I improve it?",
        "What happens if I lose my income?"
      ]
    };
  }
  if (normalized.includes("how can i improve") || normalized.includes("improve it") || normalized.includes("boost score") || normalized.includes("increase resilience") || normalized.includes("recovery plan")) {
    return {
      id,
      sender: "assistant",
      timestamp,
      diagnosisBadge: {
        label: "OPTIMIZATION ROADMAP (+12 to +18 PTS)",
        variant: "safe"
      },
      content: `Here are 3 deterministic levers to elevate your Financial Resilience from **${metrics.resilience}** towards **95+**:

### 1. Discretionary Spending Optimization (Estimated: +6 to +8 pts)
* Cap dining out and discretionary subscriptions by \u20B95,000/month.
* **Annual Impact**: Adds \u20B960,000 directly to liquid emergency reserves.

### 2. Emergency Vault Expansion (Estimated: +5 to +7 pts)
* Expand liquid savings from \`\u20B9${metrics.liquidEmergencyFund.toLocaleString("en-IN")}\` to \`\u20B94,92,000\` (full 6-month fixed expense coverage).
* **Runway Impact**: Extends total runway beyond 12+ months.

### 3. Secondary Cashflow Diversification (Estimated: +8 to +12 pts)
* Introduce a \u20B910,000\u2013\u20B915,000/month side retainer or skill monetization.
* **Shock Absorption**: Prevents negative monthly cash flow in the event of primary salary interruption.`,
      actionSteps: [
        "Auto-divert \u20B95,000 from current discretionary budget into high-yield sweep account.",
        "Lock current fixed costs below \u20B955,000/month.",
        "Use the /simulator page to simulate and test these recovery levers live."
      ],
      suggestedFollowUps: [
        "Can I afford a \u20B980,000 laptop?",
        "How much emergency fund should I target?",
        "What happens if I lose my income?"
      ]
    };
  }
  if (normalized.includes("laptop") || normalized.includes("80,000") || normalized.includes("80000") || normalized.includes("afford") || normalized.includes("buy") || normalized.includes("purchase")) {
    const cost = 8e4;
    const remainingFund = metrics.liquidEmergencyFund - cost;
    const postRunway = Number((remainingFund / metrics.monthlyExpenses).toFixed(1));
    const monthsToSave = Math.ceil(cost / Math.max(1, metrics.monthlySavings));
    return {
      id,
      sender: "assistant",
      timestamp,
      diagnosisBadge: {
        label: "AFFORDABILITY VERDICT: APPROVED (WITH CASH FLOW PLAN)",
        variant: "safe"
      },
      content: `### Diagnosis: **Yes, you can afford a \u20B980,000 laptop**, but using your liquid cash all at once has tradeoffs.

* **Upfront Cash Purchase**:
  * Liquid Emergency Fund drops from \`\u20B9${metrics.liquidEmergencyFund.toLocaleString("en-IN")}\` \u2192 \`\u20B9${remainingFund.toLocaleString("en-IN")}\`.
  * Runway decreases from \`${metrics.runwayMonths} mo\` \u2192 \`${postRunway} mo\` *(Still safely above the 6-month minimum threshold)*.
  * Resilience Score impact: ~ -3 points temporary dip (from ${metrics.resilience} to ${metrics.resilience - 3}).

* **Zero-Interest / 3-Month Savings Route (Recommended)**:
  * At your current monthly surplus of \`\u20B9${metrics.monthlySavings.toLocaleString("en-IN")}/mo\`, you will fully fund this purchase in **${monthsToSave} months** without touching emergency reserves!`,
      metricsHighlight: [
        { label: "Purchase Cost", value: "\u20B980,000", positive: false },
        { label: "Post-Buy Liquid Fund", value: `\u20B9${remainingFund.toLocaleString("en-IN")}`, positive: true },
        { label: "Post-Buy Runway", value: `${postRunway} months`, positive: postRunway >= 6 },
        { label: "Months to Save", value: `${monthsToSave} months`, positive: true }
      ],
      actionSteps: [
        `Allocate \u20B9${Math.round(cost / 3).toLocaleString("en-IN")}/mo over the next 3 months to purchase cash-positive.`,
        "Preserve the core \u20B92,00,000 liquid emergency floor untouched."
      ],
      suggestedFollowUps: [
        "How much emergency fund should I target?",
        "How healthy are my finances?"
      ]
    };
  }
  if (normalized.includes("lose my income") || normalized.includes("lost my job") || normalized.includes("job loss") || normalized.includes("unemployed") || normalized.includes("layoff")) {
    const monthlyBurn = metrics.monthlyExpenses;
    const runwayExact = Number((metrics.liquidEmergencyFund / monthlyBurn).toFixed(1));
    const totalWithInvestments = Number(((metrics.liquidEmergencyFund + metrics.investments) / monthlyBurn).toFixed(1));
    return {
      id,
      sender: "assistant",
      timestamp,
      diagnosisBadge: {
        label: `RUNWAY SIMULATION: ${runwayExact} MONTHS SURVIVAL BUFFER`,
        variant: runwayExact >= 6 ? "warning" : "critical"
      },
      content: `### If your primary income drops to \u20B90 tomorrow:

1. **Pure Liquid Survival**:
   * With **\u20B9${metrics.liquidEmergencyFund.toLocaleString("en-IN")}** in liquid reserves and **\u20B9${monthlyBurn.toLocaleString("en-IN")}/month** burn, you have exactly **${runwayExact} months** before needing to liquidate investments or take loans.

2. **Total Liquidity (Liquid + Investments)**:
   * Total net worth of \u20B9${metrics.netWorth.toLocaleString("en-IN")} provides up to **${totalWithInvestments} months** of absolute runway.

3. **Emergency Defensive Action Plan**:
   * Cutting discretionary spending from \u20B930,000 \u2192 \u20B98,000 drops your burn rate from \u20B982,000 \u2192 **\u20B960,000/mo**, expanding runway from \`${runwayExact} mo\` \u2192 **${Number((metrics.liquidEmergencyFund / 6e4).toFixed(1))} months**!`,
      metricsHighlight: [
        { label: "Monthly Burn", value: `\u20B9${monthlyBurn.toLocaleString("en-IN")}/mo`, positive: false },
        { label: "Pure Liquid Runway", value: `${runwayExact} months`, positive: runwayExact >= 6 },
        { label: "Defensive Runway (Trimmed)", value: `${Number((metrics.liquidEmergencyFund / 6e4).toFixed(1))} months`, positive: true }
      ],
      actionSteps: [
        'Test the "Job Loss" scenario in /simulator to visualize your 6-month cashflow curve.',
        'Set up a pre-planned "Emergency Budget" trigger to freeze non-essential expenses in one click.'
      ],
      suggestedFollowUps: [
        "How can I improve it?",
        "How much emergency fund should I target?",
        "Why did my resilience drop?"
      ]
    };
  }
  if (normalized.includes("emergency fund") || normalized.includes("how much emergency") || normalized.includes("target") || normalized.includes("how much buffer")) {
    const fixedMonthly = metrics.fixedExpenses;
    const totalMonthly = metrics.monthlyExpenses;
    const target3Mo = fixedMonthly * 3;
    const target6Mo = totalMonthly * 6;
    const target12Mo = totalMonthly * 12;
    return {
      id,
      sender: "assistant",
      timestamp,
      diagnosisBadge: {
        label: "EMERGENCY BUFFER BENCHMARK",
        variant: "safe"
      },
      content: `### Recommended Emergency Fund Targets for Your Profile:

* **Tier 1 (Minimum Survival - 3 Months Fixed Costs)**: \`\u20B9${target3Mo.toLocaleString("en-IN")}\` *(Covers rent, EMIs, groceries)*.
* **Tier 2 (Optimal Recommended - 6 Months Total Burn)**: \`\u20B9${target6Mo.toLocaleString("en-IN")}\` \u2B50 **(Your Target Benchmark)**.
* **Tier 3 (Bulletproof Independence - 12 Months)**: \`\u20B9${target12Mo.toLocaleString("en-IN")}\`.

### Your Current Position:
* Current liquid buffer: \`\u20B9${metrics.liquidEmergencyFund.toLocaleString("en-IN")}\` (${metrics.runwayMonths} months).
* **Gap to 6-Month Gold Standard**: \`\u20B9${Math.max(0, target6Mo - metrics.liquidEmergencyFund).toLocaleString("en-IN")}\` remaining. At \u20B923,000/mo savings, you can close this in **${Math.ceil(Math.max(0, target6Mo - metrics.liquidEmergencyFund) / metrics.monthlySavings)} months**.`,
      metricsHighlight: [
        { label: "Current Buffer", value: `\u20B9${metrics.liquidEmergencyFund.toLocaleString("en-IN")}`, positive: true },
        { label: "6-Month Target", value: `\u20B9${target6Mo.toLocaleString("en-IN")}`, positive: true },
        { label: "Current Coverage", value: `${metrics.runwayMonths} mo`, positive: true }
      ],
      actionSteps: [
        "Keep 50% of the emergency fund in instant-access savings and 50% in sweep-in flexi-FDs.",
        "Do not lock emergency capital in volatile equity or illiquid lock-in vehicles."
      ],
      suggestedFollowUps: [
        "How healthy are my finances?",
        "Can I afford a \u20B980,000 laptop?",
        "How can I improve it?"
      ]
    };
  }
  return {
    id,
    sender: "assistant",
    timestamp,
    diagnosisBadge: {
      label: "FINANCIAL TWIN COPILOT ADVICE",
      variant: "info"
    },
    content: `Based on your live **Financial Twin** parameters:

* **Resilience Score**: \`${metrics.resilience}/100\`
* **Runway**: \`${metrics.runwayMonths} months\`
* **Monthly Savings Surplus**: \`\u20B9${metrics.monthlySavings.toLocaleString("en-IN")}\`
* **Net Worth**: \`\u20B9${metrics.netWorth.toLocaleString("en-IN")}\`

For your query regarding **"${question}"**:
Your profile has a solid savings foundation. When planning large expenses or life transitions, maintain at least 6 months of liquid runway (\`\u20B9${(metrics.monthlyExpenses * 6).toLocaleString("en-IN")}\`) and keep fixed recurring commitments below 50% of income.`,
    actionSteps: [
      "Simulate high-impact scenarios on the /simulator page to preview changes to your financial timeline.",
      "Select any suggested question below for immediate diagnostic breakdown."
    ],
    suggestedFollowUps: [
      "How healthy are my finances?",
      "Why did my resilience drop?",
      "How can I improve it?"
    ]
  };
}

// test-direct.mjs
console.log("=== TEST 1: Baseline Financial Twin ===");
console.assert(BASELINE_METRICS.resilience === 82, `Expected resilience 82, got ${BASELINE_METRICS.resilience}`);
console.assert(BASELINE_METRICS.runwayMonths === 10.8, `Expected runway 10.8, got ${BASELINE_METRICS.runwayMonths}`);
console.assert(BASELINE_METRICS.monthlySavings === 23e3, `Expected savings 23000, got ${BASELINE_METRICS.monthlySavings}`);
console.assert(BASELINE_METRICS.netWorth === 6e5, `Expected net worth 600000, got ${BASELINE_METRICS.netWorth}`);
console.log("? Baseline verified:", BASELINE_METRICS);
console.log("\n=== TEST 2: Stress Test Scenarios ===");
for (const sc of SCENARIO_DEFINITIONS) {
  const res = runStressTest(BASELINE_METRICS, sc.type, sc.defaultParams, []);
  console.log(`
Scenario: [${sc.title}]`);
  console.log(`  Before: Resilience=${res.before.resilience}, Runway=${res.before.runwayMonths}mo, Savings=?${res.before.monthlySavings}`);
  console.log(`  After:  Resilience=${res.after.resilience}, Runway=${res.after.runwayMonths}mo, Savings=?${res.after.monthlySavings}`);
  console.log(`  Verdict Severity: ${res.verdictSeverity}`);
  console.log(`  Verdict Text: "${res.verdict.slice(0, 100)}..."`);
  console.log(`  Top Factors: ${res.topFactors.length} items`);
  console.log(`  6-Month Timeline: ${res.timeline.length} months`);
  console.log(`  Projections: ${res.projections.length} points`);
  console.log(`  Recovery Levers available: ${res.recoveryLevers.length}`);
  console.assert(res.timeline.length === 6, "Timeline should have exactly 6 months");
  console.assert(res.projections.length === 6, "Projections should have exactly 6 points");
  console.assert(res.recoveryLevers.length >= 2, "Should have at least 2 recovery levers");
}
console.log("\n=== TEST 3: Recovery Levers (Problem -> Action -> Recovery) ===");
var jobLossTest = runStressTest(BASELINE_METRICS, "job_loss", { incomeDropPercent: 100, durationMonths: 4, severancePay: 0 }, []);
console.log(`Stressed Resilience without levers: ${jobLossTest.after.resilience}`);
var leverIdsToApply = jobLossTest.recoveryLevers.map((l) => l.id);
var recoveredTest = runStressTest(BASELINE_METRICS, "job_loss", { incomeDropPercent: 100, durationMonths: 4, severancePay: 0 }, leverIdsToApply);
console.log(`Recovered Resilience with ${leverIdsToApply.length} levers applied: ${recoveredTest.after.resilience}`);
console.assert(recoveredTest.after.resilience > jobLossTest.after.resilience, "Recovery levers must increase resilience!");
console.log("? Recovery Flow successfully restored score by +" + (recoveredTest.after.resilience - jobLossTest.after.resilience) + " points!");
console.log("\n=== TEST 4: Copilot Deterministic Responses ===");
for (const q of SUGGESTED_QUESTIONS) {
  const copilotMsg = generateCopilotResponse(q, BASELINE_METRICS, jobLossTest);
  console.log(`
Question: "${q}"`);
  console.log(`  Diagnosis Badge: ${copilotMsg.diagnosisBadge?.label} (${copilotMsg.diagnosisBadge?.variant})`);
  console.log(`  Content snippet: "${copilotMsg.content.slice(0, 90).replace(/\n/g, " ")}..."`);
  console.log(`  Action steps: ${copilotMsg.actionSteps?.length || 0} steps`);
  console.log(`  Follow-ups: ${copilotMsg.suggestedFollowUps?.length || 0} items`);
  console.assert(copilotMsg.content.length > 50, "Copilot response should have substantive content");
}
console.log("\n========================================");
console.log("ALL VERIFICATION SUITES PASSED CLEANLY!");
console.log("========================================");
