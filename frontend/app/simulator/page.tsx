"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { GlassCard, MetricLabel, PrimaryButton, SectionHeading, AnimatedNumber } from "@/components/ui/finance";
import {
  calculateDerived,
  runSimulation,
  formatINR,
  getPresetScenarios,
  DEMO_FINANCIAL_PROFILE,
} from "@/financial-engine";
import type { FinancialProfile, SimulationScenario } from "@/financial-engine";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Zap,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Shield,
  Bot,
  Sliders,
  RotateCcw,
} from "lucide-react";

export default function SimulatorPage() {
  const baselineProfile = DEMO_FINANCIAL_PROFILE;
  const baselineMetrics = calculateDerived(baselineProfile);
  const presets = getPresetScenarios();

  const [activePresetId, setActivePresetId] = useState<string>("job_loss");
  const [customIncome, setCustomIncome] = useState<number>(baselineProfile.income);
  const [customEssential, setCustomEssential] = useState<number>(baselineProfile.essentialExpenses);
  const [customDiscretionary, setCustomDiscretionary] = useState<number>(baselineProfile.discretionaryExpenses);

  // Active scenario definition
  const selectedPreset = presets.find((p) => p.id === activePresetId);
  const activeScenario: SimulationScenario = selectedPreset
    ? selectedPreset.scenario
    : {
        incomeChangePercent: ((customIncome - baselineProfile.income) / (baselineProfile.income || 1)) * 100,
      };

  // Run deterministic calculation
  const simulation = runSimulation(baselineProfile, activeScenario);

  const handleSelectPreset = (id: string) => {
    setActivePresetId(id);
    const p = presets.find((item) => item.id === id);
    if (p) {
      if (p.scenario.incomeChangePercent !== undefined) {
        const factor = 1 + p.scenario.incomeChangePercent / 100;
        setCustomIncome(Math.round(baselineProfile.income * factor));
      } else {
        setCustomIncome(baselineProfile.income);
      }
      if (p.scenario.rentChangePercent !== undefined) {
        const factor = 1 + p.scenario.rentChangePercent / 100;
        setCustomEssential(Math.round(baselineProfile.essentialExpenses * factor));
      } else {
        setCustomEssential(baselineProfile.essentialExpenses);
      }
      if (p.scenario.discretionaryReductionAmount !== undefined) {
        setCustomDiscretionary(Math.max(0, baselineProfile.discretionaryExpenses - p.scenario.discretionaryReductionAmount));
      } else {
        setCustomDiscretionary(baselineProfile.discretionaryExpenses);
      }
    }
  };

  const handleReset = () => {
    setActivePresetId("job_loss");
    setCustomIncome(baselineProfile.income);
    setCustomEssential(baselineProfile.essentialExpenses);
    setCustomDiscretionary(baselineProfile.discretionaryExpenses);
  };

  // Format chart data combining baseline and scenario projections
  const chartData = simulation.monthlyProjection.baseline.map((basePt, idx) => {
    const scenPt = simulation.monthlyProjection.scenario[idx];
    return {
      month: `M${basePt.month}`,
      baselineNetWorth: basePt.netWorth,
      scenarioNetWorth: scenPt ? scenPt.netWorth : basePt.netWorth,
      baselineResilience: basePt.resilience,
      scenarioResilience: scenPt ? scenPt.resilience : basePt.resilience,
    };
  });

  const deltaResilience = simulation.delta.resilience;
  const deltaRunway = simulation.delta.runway;
  const deltaSavings = simulation.delta.monthlySavings;

  return (
    <main className="dashboard">
      <SiteNav />

      {/* Header */}
      <div className="dashboard-head">
        <div>
          <MetricLabel>FINANCIAL TWIN // STRESS TEST SIMULATOR</MetricLabel>
          <h1>Pressure-test your financial model.</h1>
          <p style={{ color: "var(--muted-text)", fontSize: "14px", marginTop: "0.5rem" }}>
            Inject catastrophic life shocks or strategic adjustments. Watch deterministic math reconstruct your future.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--muted-text)] hover:text-[var(--foreground)] text-xs font-mono transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET TO BASELINE</span>
        </button>
      </div>

      {/* 1. Preset Shock Selector Matrix */}
      <section className="dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
        <GlassCard>
          <SectionHeading
            eyebrow="PRESET SCENARIOS"
            title="1. Select an unexpected life event or shock."
            detail="Calibrated macroeconomic and personal stress scenarios computed in real-time."
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {presets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-4 text-left rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--surface)] shadow-[0_0_20px_rgba(159,207,150,0.15)]"
                      : "border-[var(--line)] bg-[var(--panel)] hover:border-[var(--muted-text)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold uppercase ${
                      isSelected ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                    }`}>
                      {preset.label}
                    </span>
                    <Zap className={`w-3.5 h-3.5 ${isSelected ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`} />
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-1.5 leading-relaxed line-clamp-2">
                    {preset.scenario.incomeChangePercent !== undefined && `${preset.scenario.incomeChangePercent}% Income `}
                    {preset.scenario.rentChangePercent !== undefined && `+${preset.scenario.rentChangePercent}% Expenses `}
                    {preset.scenario.unexpectedExpense !== undefined && `${formatINR(preset.scenario.unexpectedExpense)} Outflow `}
                    {preset.scenario.discretionaryReductionAmount !== undefined && `-${formatINR(preset.scenario.discretionaryReductionAmount)} Discretionary `}
                    {preset.scenario.durationMonths ? `(${preset.scenario.durationMonths} Mo Duration)` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </section>

      {/* 2. Side-by-Side Impact Matrix & Engine Causality */}
      <section className="dashboard-grid top-grid" style={{ marginTop: "1rem" }}>
        {/* Left: Metric Comparison Cards */}
        <GlassCard>
          <SectionHeading
            eyebrow="SIMULATED DELTA"
            title="2. Impact on Financial Vitals"
            detail="Before vs After simulation results."
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Resilience Score */}
            <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <span className="text-[10px] font-mono text-[var(--muted-text)] uppercase block">
                Resilience Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-mono font-light text-[var(--foreground)]">
                  {simulation.scenario.resilienceScore}
                </span>
                <span className="text-xs font-mono text-[var(--muted-text)]">
                  / 100
                </span>
                <span className={`text-xs font-mono font-bold ml-auto ${
                  deltaResilience >= 0 ? "text-[var(--accent)]" : "text-[var(--critical)]"
                }`}>
                  {deltaResilience > 0 ? "+" : ""}{deltaResilience} PTS
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--muted-text)] mt-1">
                Baseline: {baselineMetrics.resilienceScore} ({baselineMetrics.resilienceBand.toUpperCase()})
              </div>
            </div>

            {/* Runway */}
            <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <span className="text-[10px] font-mono text-[var(--muted-text)] uppercase block">
                Burn Runway
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-mono font-light text-[var(--foreground)]">
                  {simulation.scenario.runwayMonths.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-[var(--muted-text)]">
                  MO
                </span>
                <span className={`text-xs font-mono font-bold ml-auto ${
                  deltaRunway >= 0 ? "text-[var(--accent)]" : "text-[var(--critical)]"
                }`}>
                  {deltaRunway > 0 ? "+" : ""}{deltaRunway.toFixed(1)} MO
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--muted-text)] mt-1">
                Baseline: {baselineMetrics.runwayMonths} MO
              </div>
            </div>

            {/* Monthly Surplus */}
            <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <span className="text-[10px] font-mono text-[var(--muted-text)] uppercase block">
                Monthly Cashflow
              </span>
              <div className="text-xl font-mono font-medium text-[var(--foreground)] mt-1">
                {formatINR(simulation.scenario.monthlySavings)}/mo
              </div>
              <div className={`text-xs font-mono mt-1 ${
                deltaSavings >= 0 ? "text-[var(--accent)]" : "text-[var(--critical)]"
              }`}>
                {deltaSavings > 0 ? "+" : ""}{formatINR(deltaSavings)} delta
              </div>
            </div>

            {/* Savings Rate */}
            <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <span className="text-[10px] font-mono text-[var(--muted-text)] uppercase block">
                Savings Rate
              </span>
              <div className="text-xl font-mono font-medium text-[var(--foreground)] mt-1">
                {simulation.scenario.savingsRate.toFixed(1)}%
              </div>
              <div className="text-xs font-mono text-[var(--muted-text)] mt-1">
                Baseline: {baselineMetrics.savingsRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right: Engine Causality Explanation */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-mono tracking-widest text-[var(--accent)] uppercase">
                ENGINE CAUSALITY EXPLANATION
              </span>
            </div>

            <blockquote className="text-sm text-[var(--foreground)] italic leading-relaxed border-l-2 border-[var(--accent)] pl-3 py-1 bg-[var(--surface)] rounded-r p-2">
              "{simulation.narrative.cause}"
            </blockquote>

            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-mono text-[var(--muted-text)] uppercase tracking-wider">
                PRIMARY STRESS VECTORS
              </div>
              <div className="flex flex-wrap gap-2">
                {simulation.narrative.topFactors.map((factor, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--line)] text-xs font-mono text-[var(--foreground)] flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3 h-3 text-[var(--amber)]" />
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--line)]">
            <Link
              href={`/copilot?scenario=${activePresetId}`}
              className="w-full py-3 bg-[var(--accent)] text-[var(--background)] font-mono text-xs font-bold uppercase rounded hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <span>Analyze Scenario with AI Copilot</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* 3. 6-Month Comparative Projection Chart */}
      <GlassCard className="forecast-card" style={{ marginTop: "1rem" }}>
        <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <MetricLabel>COMPARATIVE FORECAST // 6 MONTH HORIZON</MetricLabel>
            <h2>Baseline vs. Simulated Trajectory</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[var(--muted-text)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[var(--accent)]" /> BASELINE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[var(--critical)]" /> SCENARIO
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--muted-text)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              tick={{ fill: "var(--muted-text)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--foreground)" }}
              formatter={(val: number, name: string) => [
                formatINR(val),
                name === "baselineNetWorth" ? "Baseline Net Worth" : "Simulated Net Worth",
              ]}
            />
            <Area type="monotone" dataKey="baselineNetWorth" stroke="var(--accent)" strokeWidth={2} fill="url(#baseGrad)" />
            <Area type="monotone" dataKey="scenarioNetWorth" stroke="var(--critical)" strokeWidth={2} strokeDasharray="4 4" fill="url(#scenGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </main>
  );
}
