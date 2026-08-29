import React from 'react';
import { ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  beforeValue: string | number;
  afterValue: string | number;
  unit?: string;
  isCurrency?: boolean;
  deltaText?: string;
  isPositiveChange?: boolean;
  isNeutral?: boolean;
  subtext?: string;
  progressPercent?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  beforeValue,
  afterValue,
  unit = '',
  isCurrency = false,
  deltaText,
  isPositiveChange,
  isNeutral = false,
  subtext,
  progressPercent,
}) => {
  const formatVal = (val: string | number) => {
    if (typeof val === 'number') {
      if (isCurrency) {
        return '₹' + val.toLocaleString('en-IN');
      }
      return val.toString();
    }
    return val;
  };

  const formattedBefore = formatVal(beforeValue);
  const formattedAfter = formatVal(afterValue);
  const isChanged = formattedBefore !== formattedAfter;

  const getDeltaBadge = () => {
    if (isNeutral || !isChanged) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          <Minus className="w-3 h-3" /> Baseline
        </span>
      );
    }
    if (isPositiveChange) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
          <TrendingUp className="w-3 h-3" /> {deltaText || 'Improved'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
        <TrendingDown className="w-3 h-3" /> {deltaText || 'Declined'}
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-surface-border p-5 hover:border-slate-600 transition-all shadow-lg backdrop-blur-sm group">
      {/* Top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
        isPositiveChange ? 'from-emerald-500 to-teal-400' : isNeutral ? 'from-slate-600 to-slate-500' : 'from-rose-500 to-amber-500'
      }`} />

      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        {getDeltaBadge()}
      </div>

      {/* Before -> After Visual */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Before</span>
          <span className="text-sm font-mono text-slate-400 line-through decoration-slate-600">
            {formattedBefore}{unit}
          </span>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />

        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">After</span>
          <span className={`text-2xl font-bold font-mono tracking-tight transition-all duration-300 ${
            isPositiveChange ? 'text-emerald-400' : isNeutral ? 'text-white' : 'text-rose-400'
          }`}>
            {formattedAfter}<span className="text-sm font-normal text-slate-400 ml-0.5">{unit}</span>
          </span>
        </div>
      </div>

      {/* Mini Progress Bar */}
      {typeof progressPercent === 'number' && (
        <div className="mt-3">
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent >= 70 ? 'bg-emerald-500' : progressPercent >= 40 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      {subtext && (
        <p className="text-[12px] text-slate-400 mt-2.5 leading-relaxed">{subtext}</p>
      )}
    </div>
  );
};
