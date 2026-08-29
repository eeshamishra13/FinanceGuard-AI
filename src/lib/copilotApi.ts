import type { DerivedMetrics, SimulationResult } from '../financial-engine/types';

export interface CopilotResponse {
  summary: string;
  keyInsights: string[];
  recommendedActions: string[];
}

export const SUGGESTED_QUESTIONS = [
  "How long can I sustain my current burn rate if income stops?",
  "What happens to my resilience score if I reduce discretionary spending by 15%?",
  "How much emergency savings should I allocate right now?",
  "What is the single highest-leverage action to improve my financial runway?"
];

export async function fetchCopilotAnalysis(
  metrics: DerivedMetrics,
  activeScenario?: SimulationResult | null
): Promise<CopilotResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_OPENAI_API_KEY missing. Returning deterministic fallback narrative.');
    return {
      summary: `Your current runway is ${metrics.runwayMonths} months with a resilience score of ${metrics.resilienceScore}/100.`,
      keyInsights: [
        `Monthly burn rate is set at $${metrics.monthlyBurn.toLocaleString()}.`,
        `Savings rate sits at ${metrics.savingsRate.toFixed(1)}%.`,
      ],
      recommendedActions: [
        'Maintain emergency reserves equal to 6 months of expenses.',
        'Review discretionary spending variables.',
      ],
    };
  }

  const prompt = `
You are a precision financial advisor AI. Analyze the following financial twin telemetry:

Baseline Metrics:
- Resilience Score: ${metrics.resilienceScore}/100 (${metrics.resilienceBand})
- Monthly Burn: $${metrics.monthlyBurn}
- Monthly Savings: $${metrics.monthlySavings}
- Runway: ${metrics.runwayMonths} months
- Net Worth: $${metrics.netWorth}

${
  activeScenario
    ? `Active Simulation Scenario:
- Event: ${activeScenario.narrative.cause}
- Score Delta: ${activeScenario.delta.resilience > 0 ? '+' : ''}${activeScenario.delta.resilience}
- Runway Delta: ${activeScenario.delta.runway > 0 ? '+' : ''}${activeScenario.delta.runway} months`
    : 'No active scenario applied.'
}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Brief 2-sentence executive diagnosis",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return content as CopilotResponse;
  } catch (error) {
    console.error('Copilot API call failed:', error);
    throw error;
  }
}