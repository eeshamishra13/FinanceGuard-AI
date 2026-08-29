import React from 'react';
import { TimelineMonth } from '../types/finance';
import { Calendar, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineMonth[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  const getStatusBadge = (status: TimelineMonth['status']) => {
    switch (status) {
      case 'safe':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Safe',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Warning',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'critical':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Critical',
          classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
    }
  };

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">6-Month Future Timeline</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Month-by-month financial twin health projection</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-slate-300">
          Forward Horizon: 6 Mo
        </span>
      </div>

      {/* Grid of 6 months */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {timeline.map((m) => {
          const badge = getStatusBadge(m.status);
          const isNegativeSavings = m.monthlySavings < 0;

          return (
            <div
              key={m.monthIndex}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                m.status === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  : m.status === 'warning'
                  ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-surface-elevated/80 border-surface-border hover:border-emerald-500/30'
              }`}
            >
              <div>
                {/* Month Header */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    {m.monthName}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.classes}`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>

                {/* Score & Runway */}
                <div className="space-y-1.5 my-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[11px] font-sans">Resilience:</span>
                    <span className={`font-bold ${
                      m.resilience >= 75 ? 'text-emerald-400' : m.resilience >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {m.resilience}/100
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[11px] font-sans">Runway:</span>
                    <span className="text-slate-200 font-semibold">{m.runwayMonths} mo</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[11px] font-sans">Net Worth:</span>
                    <span className="text-slate-200">₹{(m.netWorth / 100000).toFixed(2)}L</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-700/50">
                    <span className="text-[11px] font-sans">Cashflow:</span>
                    <span className={`font-semibold ${isNegativeSavings ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isNegativeSavings ? '-' : '+'}₹{Math.abs(m.monthlySavings).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
                {m.notes}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
