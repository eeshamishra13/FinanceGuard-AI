import React from 'react';
import { RecoveryLever } from '../types/finance';
import { Sparkles, Check, Plus, Zap } from 'lucide-react';

interface RecoveryLeversProps {
  levers: RecoveryLever[];
  onToggleLever: (leverId: string) => void;
  appliedCount: number;
}

export const RecoveryLevers: React.FC<RecoveryLeversProps> = ({
  levers,
  onToggleLever,
  appliedCount,
}) => {
  if (!levers || levers.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0f1d2e] to-[#0a121f] border-2 border-emerald-500/40 p-6 sm:p-8 shadow-glow-emerald backdrop-blur-md relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Action & Recovery Plan
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                HOW CAN WE RECOVER?
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Deterministic recommendations to neutralize stress, rebalance cash flow, and restore your Resilience score.
          </p>
        </div>

        {/* Action Status Pill */}
        <div className="flex items-center gap-2 bg-[#080d16] px-3.5 py-2 rounded-xl border border-emerald-500/30 self-start">
          <span className="text-xs text-slate-300 font-medium">Applied Actions:</span>
          <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
            {appliedCount}/{levers.length} Active
          </span>
        </div>
      </div>

      {/* Levers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {levers.map((lever) => {
          const isApplied = lever.applied;

          return (
            <div
              key={lever.id}
              className={`rounded-xl p-5 border transition-all duration-300 flex flex-col justify-between relative ${
                isApplied
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-glow-emerald scale-[1.02]'
                  : 'bg-surface-card border-surface-border hover:border-slate-500'
              }`}
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    +{lever.resilienceBoost} Resilience Pts
                  </span>

                  {lever.monthlyImpact > 0 && (
                    <span className="text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                      +₹{lever.monthlyImpact.toLocaleString('en-IN')}/mo
                    </span>
                  )}
                  {lever.lumpSumImpact > 0 && (
                    <span className="text-xs font-mono font-semibold text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/20">
                      +₹{lever.lumpSumImpact.toLocaleString('en-IN')} Cash
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-base text-white tracking-tight mb-1.5">
                  {lever.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {lever.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onToggleLever(lever.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isApplied
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400'
                    : 'bg-surface-elevated text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>APPLIED (ACTIVE)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>APPLY RECOVERY LEVER</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer flow tip */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2 font-mono">
          <span className="text-rose-400 font-bold uppercase">Problem</span>
          <span>→</span>
          <span className="text-amber-400 font-bold uppercase">Action</span>
          <span>→</span>
          <span className="text-emerald-400 font-bold uppercase">Recovery</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Clicking APPLY immediately recalculates your twin and animates resilience recovery.
        </span>
      </div>
    </div>
  );
};
