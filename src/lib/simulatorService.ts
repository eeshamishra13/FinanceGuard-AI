import type { DerivedMetrics, SimulationResult } from '../financial-engine/types';

export const DEFAULT_CURRENT = {
  income: 8500,
  expenses: 5200,
  savings: 3300,
  netWorth: 125000,
  runwayMonths: 18,
  resilienceScore: 78,
};

export const SCENARIOS = [
  {
    id: 'job-loss',
    title: 'Sudden Job Loss',
    description: 'Income drops to zero. Test your baseline emergency runway.',
    incomeChange: -8500,
    expenseChange: 0,
  },
  {
    id: 'rent-hike',
    title: 'Rent & Cost Inflation (+20%)',
    description: 'Fixed expenses increase substantially due to market shifts.',
    incomeChange: 0,
    expenseChange: 1040,
  },
  {
    id: 'market-crash',
    title: 'Market Correction (-25% Net Worth)',
    description: 'Invested capital contracts, reducing total liquid reserve cushion.',
    incomeChange: 0,
    expenseChange: 0,
  },
  {
    id: 'side-hustle',
    title: 'New Revenue Stream (+$2,000/mo)',
    description: 'Secondary income increases savings rate and resilience.',
    incomeChange: 2000,
    expenseChange: 0,
  },
];

export function runSimulation(
  current = DEFAULT_CURRENT,
  scenarioId?: string,
  customExpenses?: number,
  customIncome?: number
) {
  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId);
  
  const modifiedIncome = customIncome !== undefined 
    ? customIncome 
    : current.income + (selectedScenario?.incomeChange || 0);

  const modifiedExpenses = customExpenses !== undefined 
    ? customExpenses 
    : current.expenses + (selectedScenario?.expenseChange || 0);

  const newSavings = Math.max(0, modifiedIncome - modifiedExpenses);
  const newRunway = modifiedExpenses > 0 ? Math.round(current.netWorth / modifiedExpenses) : 99;
  
  const scoreBase = (newSavings / (modifiedIncome || 1)) * 50 + Math.min(newRunway * 2, 50);
  const newResilience = Math.max(10, Math.min(100, Math.round(scoreBase)));

  return {
    before: { ...current },
    after: {
      income: modifiedIncome,
      expenses: modifiedExpenses,
      savings: newSavings,
      netWorth: current.netWorth,
      runwayMonths: newRunway,
      resilienceScore: newResilience,
    },
    scenario: selectedScenario,
  };
}

export function createSimulationPayload(
  baseline: typeof DEFAULT_CURRENT,
  scenarioTitle: string,
  modifiedExpenses: number,
  modifiedIncome: number
): SimulationResult {
  const newSavings = modifiedIncome - modifiedExpenses;
  const newRunway = modifiedExpenses > 0 ? Math.round(baseline.netWorth / modifiedExpenses) : 99;
  
  const scoreBase = (newSavings / (modifiedIncome || 1)) * 50 + Math.min(newRunway * 2, 50);
  const newResilience = Math.max(10, Math.min(100, Math.round(scoreBase)));

  const baselineMetrics: DerivedMetrics = {
    totalExpenses: baseline.expenses,
    monthlySavings: baseline.savings,
    savingsRate: (baseline.savings / baseline.income) * 100,
    monthlyBurn: baseline.expenses,
    netWorth: baseline.netWorth,
    runwayMonths: baseline.runwayMonths,
    resilienceScore: baseline.resilienceScore,
    resilienceBand: baseline.resilienceScore >= 80 ? 'healthy' : baseline.resilienceScore >= 50 ? 'warning' : 'critical',
    resilienceBreakdown: { emergencyFund: 30, savingsRate: 20, debtBurden: 20, expenseStability: 15, incomeStability: 15 },
  };

  const scenarioMetrics: DerivedMetrics = {
    ...baselineMetrics,
    totalExpenses: modifiedExpenses,
    monthlySavings: newSavings,
    savingsRate: modifiedIncome > 0 ? (newSavings / modifiedIncome) * 100 : 0,
    monthlyBurn: modifiedExpenses,
    runwayMonths: newRunway,
    resilienceScore: newResilience,
    resilienceBand: newResilience >= 80 ? 'healthy' : newResilience >= 50 ? 'warning' : 'critical',
  };

  return {
    baseline: baselineMetrics,
    scenario: scenarioMetrics,
    delta: {
      resilience: newResilience - baseline.resilienceScore,
      runway: newRunway - baseline.runwayMonths,
    },
    narrative: {
      cause: scenarioTitle,
      topFactors: [
        modifiedExpenses > baseline.expenses ? 'Expense Increase' : 'Expense Reduction',
        modifiedIncome < baseline.income ? 'Income Loss' : 'Income Increase',
      ],
    },
  };
}