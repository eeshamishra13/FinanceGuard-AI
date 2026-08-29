import { NextResponse } from "next/server";
import {
  calculateDerived,
  DEMO_FINANCIAL_PROFILE,
  formatINR,
  runSimulation,
  getPresetScenarios,
} from "@/financial-engine";
import type { DerivedMetrics, SimulationResult, FinancialProfile } from "@/financial-engine";

export interface CopilotApiResponse {
  summary: string;
  keyInsights: string[];
  recommendedActions: string[];
  isAIGenerated: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      query = "",
      metrics: inputMetrics,
      activeScenario,
      profile: inputProfile,
    } = body;

    const profile: FinancialProfile = inputProfile || DEMO_FINANCIAL_PROFILE;
    const metrics: DerivedMetrics = inputMetrics || calculateDerived(profile);

    const apiKey = process.env.OPENAI_API_KEY;

    // If an OpenAI API Key is provided, use GPT-4o-mini
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes("your_openai_api_key")) {
      try {
        const systemPrompt = `You are FinanceGuard Copilot, an expert AI financial advisor and digital twin analyst.
Analyze the user's financial telemetry and question.

Baseline Metrics:
- Net Worth: ${formatINR(metrics.netWorth)}
- Monthly Inflow: ${formatINR(profile.income + profile.otherIncome)}
- Total Expenses: ${formatINR(metrics.totalExpenses)} (Essential: ${formatINR(profile.essentialExpenses)}, Discretionary: ${formatINR(profile.discretionaryExpenses)})
- Monthly Debt Service: ${formatINR(profile.monthlyDebtPayment)}
- Monthly Net Savings: ${formatINR(metrics.monthlySavings)}
- Savings Rate: ${metrics.savingsRate.toFixed(1)}%
- Runway: ${metrics.runwayMonths.toFixed(1)} months
- Resilience Score: ${metrics.resilienceScore}/100 (${metrics.resilienceBand.toUpperCase()})
- Emergency Fund Score: ${metrics.resilienceBreakdown.emergencyFund}/30
- Savings Rate Score: ${metrics.resilienceBreakdown.savingsRate}/25
- Debt Burden Score: ${metrics.resilienceBreakdown.debtBurden}/20
- Expense Stability Score: ${metrics.resilienceBreakdown.expenseStability}/15

${
  activeScenario
    ? `Active Simulation Scenario:
- Event: ${activeScenario.narrative?.cause || "Custom stress simulation"}
- Resilience Delta: ${activeScenario.delta?.resilience > 0 ? "+" : ""}${activeScenario.delta?.resilience || 0} pts
- Runway Delta: ${activeScenario.delta?.runway > 0 ? "+" : ""}${activeScenario.delta?.runway || 0} mo
- Monthly Savings Delta: ${formatINR(activeScenario.delta?.monthlySavings || 0)}`
    : "No active shock scenario applied."
}

User Question: "${query || "Provide a comprehensive financial diagnosis and top recovery moves."}"

Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "2-sentence executive diagnosis tailored to their numbers",
  "keyInsights": [
    "Specific analytical observation with actual numbers",
    "Specific analytical observation on risk or runway",
    "Specific observation on scenario vulnerability or buffer"
  ],
  "recommendedActions": [
    "Concrete, immediate high-leverage action item with target amount",
    "Medium-term structural optimization recommendation",
    "Risk mitigation or buffer preservation step"
  ]
}`;

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          return NextResponse.json({
            summary: parsed.summary || `Your resilience score is ${metrics.resilienceScore}/100 with ${metrics.runwayMonths} months of liquid runway.`,
            keyInsights: parsed.keyInsights || [],
            recommendedActions: parsed.recommendedActions || [],
            isAIGenerated: true,
          } as CopilotApiResponse);
        } else {
          console.warn("OpenAI API call returned non-200, falling back to deterministic engine:", openAiRes.statusText);
        }
      } catch (apiErr) {
        console.error("OpenAI call exception, engaging deterministic fallback:", apiErr);
      }
    }

    // Deterministic Offline Fallback using Financial Engine calculations
    const isUnderStress = activeScenario && activeScenario.delta && activeScenario.delta.resilience < 0;
    const isCritical = metrics.resilienceBand === "critical";
    const isWarning = metrics.resilienceBand === "warning";

    let summary = `Your financial twin maintains an equilibrium resilience score of ${metrics.resilienceScore}/100 (${metrics.resilienceBand.toUpperCase()}) with ${metrics.runwayMonths.toFixed(1)} months of emergency burn runway.`;
    
    if (isUnderStress) {
      summary = `Active shock event detected: ${activeScenario.narrative?.cause || "Simulated stress event"}. Projected resilience adjusts by ${activeScenario.delta.resilience} pts to ${activeScenario.scenario?.resilienceScore || metrics.resilienceScore}/100.`;
    } else if (isCritical) {
      summary = `Warning: High systemic vulnerability detected. Current survival runway sits at ${metrics.runwayMonths.toFixed(1)} months against essential burn of ${formatINR(metrics.monthlyBurn)}/month.`;
    }

    const keyInsights = [
      `Monthly retained surplus is ${formatINR(metrics.monthlySavings)}/mo, representing a ${metrics.savingsRate.toFixed(1)}% net savings rate.`,
      `Emergency liquidity reserves provide ${metrics.runwayMonths.toFixed(1)} months of runway (${formatINR(profile.emergencyFund)}) against fixed burn.`,
      activeScenario
        ? `Scenario impact reduces net surplus by ${formatINR(Math.abs(activeScenario.delta?.monthlySavings || 0))}/mo.`
        : `Debt service ratio is ${((profile.monthlyDebtPayment / (profile.income + profile.otherIncome || 1)) * 100).toFixed(1)}% of gross monthly inflow.`,
    ];

    const recommendedActions = [
      `Lock minimum 6 months of fixed burn (${formatINR(metrics.monthlyBurn * 6)}) into high-yield liquid instruments.`,
      profile.discretionaryExpenses > 5000
        ? `Trim discretionary spending by 10% (${formatINR(profile.discretionaryExpenses * 0.1)}/mo) to expand monthly surplus.`
        : `Maintain current disciplined expense ceiling of ${formatINR(metrics.totalExpenses)}/mo.`,
      profile.debt > 0
        ? `Prioritize amortization on high-interest leverage (${formatINR(profile.debt)}) to unlock ${formatINR(profile.monthlyDebtPayment)}/mo in cashflow.`
        : `Rebalance surplus capital into diversified growth assets once emergency buffer reaches 12 months.`,
    ];

    return NextResponse.json({
      summary,
      keyInsights,
      recommendedActions,
      isAIGenerated: false,
    } as CopilotApiResponse);
  } catch (error) {
    console.error("Copilot API Route error:", error);
    return NextResponse.json(
      {
        summary: "Your financial twin is in equilibrium with stable baseline telemetry.",
        keyInsights: ["Offline deterministic model active."],
        recommendedActions: ["Maintain target emergency runway."],
        isAIGenerated: false,
      },
      { status: 200 }
    );
  }
}
