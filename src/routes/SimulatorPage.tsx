import React, { useState } from 'react';
import { 
  BASELINE_METRICS, 
  SCENARIO_DEFINITIONS, 
  runStressTest, 
  ScenarioDefinition 
} from '../lib/simulatorService';
import { 
  ScenarioType, 
  StressTestResult 
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
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  MessageSquareText, 
  Layers, 
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
    return runStressTest(BASELINE_METRICS, 'job_loss', { incomeDropPercent: 100, durationMonths: 4, severancePay: 0 }, []);
  });

  const handleSelectScenario = (scenario: ScenarioDefinition) => {
    setSelectedScenario(scenario.type);
    setScenarioParams({ ...scenario.defaultParams });
    setAppliedLeverIds([]);
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

  const handleExecuteStressTest = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const result = runStressTest(BASELINE_METRICS, selectedScenario, scenarioParams, appliedLeverIds);
      setTestResult(result);
      onUpdateStressedState(result);
      setIsCalculating(false);
    }, 400);
  };

  const handleToggleLever = (leverId: string) => {
    const isCurrentlyApplied = appliedLeverIds.includes(leverId);
    const updated = isCurrentlyApplied
      ? appliedLeverIds.filter((id) => id !== leverId)
      : [...appliedLeverIds, leverId];

    setAppliedLeverIds(updated);

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
      {/* Top Banner */}
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

        {/* Shortcut to Copilot */}
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
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${BASELINE_METRICS.resilience}%` }} />
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
                type="button"
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

          <MetricCard
            label="Survival Emergency Runway"
            beforeValue={testResult.before.runwayMonths}
            afterValue={testResult.after.runwayMonths}
            unit=" mo"
            deltaText={`${(testResult.after.runwayMonths - testResult.before.runwayMonths).toFixed(1)} mo`}
            isPositiveChange={testResult.after.runwayMonths >= testResult.before.runwayMonths}
            subtext={`Liquid buffer available to absorb monthly expenditures.`}
          />

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
