import React, { useEffect, useState } from 'react';
import { CurrentFinancialState, SimulationAfterState } from '../types/finance';

interface BeforeAfterPanelProps {
  before: CurrentFinancialState;
  after: SimulationAfterState;
  isSimulating: boolean;
  scenarioTitle: string;
}

function useAnimatedNumber(target: number, isSimulating: boolean, duration: number = 800) {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    if (isSimulating) return;

    let start = current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + diff * ease));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCurrent(target);
      }
    };

    requestAnimationFrame(frame);
  }, [target, isSimulating]);

  return current;
}

function useAnimatedFloat(target: number, isSimulating: boolean, duration: number = 800) {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    if (isSimulating) return;

    let start = current;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) return;

    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Number((start + diff * ease).toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCurrent(target);
      }
    };

    requestAnimationFrame(frame);
  }, [target, isSimulating]);

  return current;
}

export const BeforeAfterPanel: React.FC<BeforeAfterPanelProps> = ({
  before,
  after,
  isSimulating,
  scenarioTitle,
}) => {
  const animResilience = useAnimatedNumber(after.resilienceScore, isSimulating, 900);
  const animRunway = useAnimatedFloat(after.runwayMonths, isSimulating, 800);
  const animBalance = useAnimatedNumber(after.projectedBalance, isSimulating, 1000);
  const animCashFlow = useAnimatedNumber(after.monthlyCashFlow, isSimulating, 850);

  const isWorse = after.resilienceScore < before.resilienceScore;

  const rows = [
    {
      label: 'Resilience Score',
      desc: 'Overall financial digital twin resistance to insolvency',
      beforeVal: `${before.resilienceScore}/100`,
      afterVal: `${animResilience}/100`,
      isNegative: animResilience < before.resilienceScore,
      delta: `${animResilience >= before.resilienceScore ? '+' : ''}${animResilience - before.resilienceScore} pts`,
    },
    {
      label: 'Emergency Runway',
      desc: 'Liquid survival buffer at current monthly expenditure rate',
      beforeVal: `${before.runwayMonths} mo`,
      afterVal: `${animRunway} mo`,
      isNegative: animRunway < before.runwayMonths,
      delta: `${(animRunway - before.runwayMonths).toFixed(1)} mo`,
    },
    {
      label: 'Projected Balance',
      desc: 'Simulated 6-month remaining net asset buffer',
      beforeVal: `?${before.netWorth.toLocaleString('en-IN')}`,
      afterVal: `?${animBalance.toLocaleString('en-IN')}`,
      isNegative: animBalance < before.netWorth,
      delta: `${animBalance >= before.netWorth ? '+' : ''}?${(animBalance - before.netWorth).toLocaleString('en-IN')}`,
    },
    {
      label: 'Monthly Cash Flow',
      desc: 'Net organic monthly savings / deficit burn rate',
      beforeVal: `+?${before.savings.toLocaleString('en-IN')}`,
      afterVal: `${animCashFlow >= 0 ? '+' : '-'}?${Math.abs(animCashFlow).toLocaleString('en-IN')}`,
      isNegative: animCashFlow < before.savings,
      delta: `${animCashFlow >= before.savings ? '+' : ''}?${(animCashFlow - before.savings).toLocaleString('en-IN')}/mo`,
    },
  ];

  return (
    <div className="rounded-xl bg-[#3B1319]/80 border border-[#C6B39A]/20 shadow-ledger overflow-hidden backdrop-blur-md">
      {/* Header Ledger Band */}
      <div className="py-4 px-5 sm:px-6 bg-[#280B0F]/90 border-b border-[#C6B39A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E] block">
            Digital Twin Ledger Audit
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-medium text-[#DFD5C6]">
            Before vs After Stress Simulation
          </h3>
        </div>

        {/* Dynamic Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
            isWorse
              ? 'bg-[#8D3A3C]/30 text-[#B85558] border-[#8D3A3C]/60 shadow-glow-rubine'
              : 'bg-[#7B694E]/25 text-[#C6B39A] border-[#C6B39A]/40 shadow-glow-camel'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isWorse ? 'bg-[#8D3A3C] animate-pulse' : 'bg-[#C6B39A]'}`} />
            {isWorse ? 'STRESSED DEFICIT' : 'POSITIVE ACCUMULATION'}
          </span>
        </div>
      </div>

      {/* Comparison Grid Header */}
      <div className="hidden sm:grid grid-cols-12 py-2.5 px-6 bg-[#280B0F]/40 border-b border-[#C6B39A]/10 text-[11px] font-mono uppercase tracking-wider text-[#7B694E]">
        <div className="col-span-5">Metric</div>
        <div className="col-span-3 text-right">Baseline (Before)</div>
        <div className="col-span-4 text-right">Simulated (After)</div>
      </div>

      {/* Comparison Rows */}
      <div className="divide-y divide-[#C6B39A]/10">
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="py-4 px-5 sm:px-6 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 hover:bg-[#280B0F]/30 transition-colors"
          >
            {/* Metric Label & Subtitle */}
            <div className="sm:col-span-5 space-y-0.5">
              <span className="font-serif text-base font-medium text-[#DFD5C6]">
                {r.label}
              </span>
              <p className="text-xs text-[#7B694E] leading-tight font-sans">
                {r.desc}
              </p>
            </div>

            {/* Before Value (Muted / Struck-through) */}
            <div className="sm:col-span-3 flex sm:justify-end items-center gap-1.5 text-xs text-[#7B694E] font-mono">
              <span className="sm:hidden uppercase text-[10px] tracking-wider text-[#7B694E]">Before:</span>
              <span className="line-through decoration-[#7B694E]/70 font-semibold">{r.beforeVal}</span>
            </div>

            {/* After Value (Animated & Tinted) */}
            <div className="sm:col-span-4 flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="sm:hidden uppercase text-[10px] tracking-wider text-[#7B694E]">After:</span>
                <span className={`font-mono text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-500 ${
                  r.isNegative ? 'text-[#B85558]' : 'text-[#C6B39A]'
                }`}>
                  {r.afterVal}
                </span>
              </div>

              <span className={`font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded border ${
                r.isNegative
                  ? 'text-[#B85558] bg-[#8D3A3C]/20 border-[#8D3A3C]/40'
                  : 'text-[#C6B39A] bg-[#7B694E]/20 border-[#C6B39A]/30'
              }`}>
                {r.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};