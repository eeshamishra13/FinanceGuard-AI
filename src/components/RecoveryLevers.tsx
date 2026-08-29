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
    <div className="rounded-xl bg-[#3B1319]/90 border border-[#C6B39A]/30 p-5 sm:p-7 shadow-ledger backdrop-blur-md relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#8D3A3C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#7B694E]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#C6B39A]/15 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E] font-medium">
              Ledger Optimization
            </span>
            <span className="text-[#C6B39A]">?</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#C6B39A]">
              Problem ? Action ? Recovery
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#DFD5C6] mt-0.5">
            How Can We Recover?
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-[#280B0F] px-3 py-1.5 rounded-lg border border-[#7B694E]/40 self-start sm:self-auto">
          <span className="text-xs text-[#7B694E] font-mono">Active Levers:</span>
          <span className="font-mono text-xs font-bold text-[#C6B39A] bg-[#3B1319] px-2 py-0.5 rounded border border-[#C6B39A]/20">
            {appliedCount}/{levers.length} Applied
          </span>
        </div>
      </div>

      {/* Lever Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {levers.map((lever) => {
          const isApplied = lever.applied;

          return (
            <div
              key={lever.id}
              className={`rounded-lg p-4 border transition-all duration-300 flex flex-col justify-between ${
                isApplied
                  ? 'bg-[#280B0F] border-[#C6B39A] shadow-glow-camel'
                  : 'bg-[#280B0F]/60 border-[#C6B39A]/15 hover:border-[#7B694E]'
              }`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#3B1319] text-[#C6B39A] border border-[#C6B39A]/30">
                    <Sparkles className="w-3 h-3 text-[#C6B39A]" />
                    +{lever.resilienceBoost} Resilience Pts
                  </span>

                  {lever.monthlyImpact > 0 && (
                    <span className="text-[11px] font-mono text-[#DFD5C6]">
                      +?{lever.monthlyImpact.toLocaleString('en-IN')}/mo
                    </span>
                  )}
                  {lever.lumpSumImpact > 0 && (
                    <span className="text-[11px] font-mono text-[#DFD5C6]">
                      +?{lever.lumpSumImpact.toLocaleString('en-IN')} Cash
                    </span>
                  )}
                </div>

                <h4 className="font-serif text-base font-medium text-[#DFD5C6] mb-1">
                  {lever.title}
                </h4>
                <p className="text-xs text-[#7B694E] font-sans leading-relaxed mb-4">
                  {lever.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onToggleLever(lever.id)}
                className={`w-full py-2 px-3 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  isApplied
                    ? 'bg-[#C6B39A] text-[#280B0F] hover:bg-[#DFD5C6]'
                    : 'bg-[#3B1319] text-[#DFD5C6] border border-[#7B694E]/50 hover:bg-[#7B694E]/30'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>APPLIED (ACTIVE)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>APPLY LEVER</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};