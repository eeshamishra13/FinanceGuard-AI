import React, { useState } from 'react';
import { SCENARIOS, runSimulation } from '../lib/simulatorService';

interface SimulatorPageProps {
  navigate: (route: string) => void;
  current: {
    income: number;
    expenses: number;
    savings: number;
    netWorth: number;
    runwayMonths: number;
    resilienceScore: number;
  };
  onActiveScenarioChange?: (scenarioResult: any) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  navigate,
  current,
  onActiveScenarioChange,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [customIncome, setCustomIncome] = useState<number>(current.income);
  const [customExpenses, setCustomExpenses] = useState<number>(current.expenses);

  // Calculate live simulation results whenever sliders or scenarios change
  const simulation = runSimulation(
    current,
    selectedScenarioId || undefined,
    customExpenses,
    customIncome
  );

  const handleScenarioSelect = (scenarioId: string) => {
    if (selectedScenarioId === scenarioId) {
      // Toggle off
      setSelectedScenarioId('');
      setCustomIncome(current.income);
      setCustomExpenses(current.expenses);
      onActiveScenarioChange?.(null);
    } else {
      setSelectedScenarioId(scenarioId);
      const sc = SCENARIOS.find((s) => s.id === scenarioId);
      const newInc = Math.max(0, current.income + (sc?.incomeChange || 0));
      const newExp = Math.max(0, current.expenses + (sc?.expenseChange || 0));
      setCustomIncome(newInc);
      setCustomExpenses(newExp);

      const result = runSimulation(current, scenarioId, newExp, newInc);
      onActiveScenarioChange?.(result);
    }
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomIncome(val);
    const result = runSimulation(current, selectedScenarioId || undefined, customExpenses, val);
    onActiveScenarioChange?.(result);
  };

  const handleExpensesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomExpenses(val);
    const result = runSimulation(current, selectedScenarioId || undefined, val, customIncome);
    onActiveScenarioChange?.(result);
  };

  const deltaResilience = simulation.after.resilienceScore - simulation.before.resilienceScore;
  const deltaRunway = simulation.after.runwayMonths - simulation.before.runwayMonths;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[var(--line)] pb-4">
        <div>
          <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest">
            Stress Test & Engine
          </span>
          <h1 className="text-3xl font-light text-[var(--foreground)] mt-1">Financial Twin Simulator</h1>
        </div>
        <button
          onClick={() => navigate('/copilot')}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-mono text-xs font-bold uppercase rounded hover:opacity-90 transition"
        >
          Analyze in Copilot &rarr;
        </button>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted-text)]">
          1. Select Preset Shock Scenario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCENARIOS.map((sc) => {
            const isActive = selectedScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleScenarioSelect(sc.id)}
                className={`p-4 text-left rounded border transition ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--panel)] shadow-lg'
                    : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--muted-text)]'
                }`}
              >
                <div className="font-mono text-xs font-bold text-[var(--foreground)]">{sc.title}</div>
                <div className="text-xs text-[var(--muted-text)] mt-1">{sc.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-[var(--panel)] border border-[var(--line)] rounded">
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted-text)]">
            2. Manual Telemetry Sliders
          </h2>
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span>Monthly Income</span>
              <span className="text-[var(--accent)]">${customIncome.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="25000"
              step="250"
              value={customIncome}
              onChange={handleIncomeChange}
              className="w-full accent-[var(--accent)]"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span>Monthly Expenses</span>
              <span className="text-[var(--critical)]">${customExpenses.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="20000"
              step="250"
              value={customExpenses}
              onChange={handleExpensesChange}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>

        {/* Live Delta Results */}
        <div className="space-y-4 border-t md:border-t-0 md:border-l border-[var(--line)] pt-4 md:pt-0 md:pl-6">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted-text)]">
            3. Simulated Impact vs Baseline
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded">
              <span className="text-[10px] font-mono text-[var(--muted-text)] block uppercase">
                Resilience Score
              </span>
              <span className="text-2xl font-bold text-[var(--foreground)]">
                {simulation.after.resilienceScore}
              </span>
              <span
                className={`text-xs font-mono ml-2 ${
                  deltaResilience >= 0 ? 'text-[var(--accent)]' : 'text-[var(--critical)]'
                }`}
              >
                {deltaResilience >= 0 ? `+${deltaResilience}` : deltaResilience}
              </span>
            </div>

            <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded">
              <span className="text-[10px] font-mono text-[var(--muted-text)] block uppercase">
                Runway (Months)
              </span>
              <span className="text-2xl font-bold text-[var(--foreground)]">
                {simulation.after.runwayMonths}
              </span>
              <span
                className={`text-xs font-mono ml-2 ${
                  deltaRunway >= 0 ? 'text-[var(--accent)]' : 'text-[var(--critical)]'
                }`}
              >
                {deltaRunway >= 0 ? `+${deltaRunway}` : deltaRunway}
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-[var(--muted-text)] pt-2">
            Net Monthly Savings:{' '}
            <span className={simulation.after.savings >= 0 ? 'text-[var(--accent)]' : 'text-[var(--critical)]'}>
              ${simulation.after.savings.toLocaleString()}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};