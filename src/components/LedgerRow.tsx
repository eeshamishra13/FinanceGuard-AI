import React from 'react';

interface LedgerRowProps {
  label: string;
  subtitle: string;
  value: string | number;
  unit?: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  progressPercent?: number;
  progressColor?: 'camel' | 'boho' | 'rubine';
  isHighlighted?: boolean;
}

export const LedgerRow: React.FC<LedgerRowProps> = ({
  label,
  subtitle,
  value,
  unit = '',
  isCurrency = false,
  trend = 'neutral',
  trendText,
  progressPercent,
  progressColor = 'camel',
  isHighlighted = false,
}) => {
  const formatVal = (v: string | number) => {
    if (typeof v === 'number') {
      if (isCurrency) {
        return '?' + v.toLocaleString('en-IN');
      }
      return v.toString();
    }
    return v;
  };

  const formatted = formatVal(value);

  const getProgressBg = () => {
    switch (progressColor) {
      case 'rubine':
        return 'bg-[#8D3A3C]';
      case 'boho':
        return 'bg-[#7B694E]';
      case 'camel':
      default:
        return 'bg-[#C6B39A]';
    }
  };

  return (
    <div className={`py-4 px-4 sm:px-6 border-b border-[#C6B39A]/15 hover:bg-[#3B1319]/40 transition-colors group ${
      isHighlighted ? 'bg-[#3B1319]/60' : ''
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left: Label (Serif) + Subtitle */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-base sm:text-lg font-medium text-[#DFD5C6] group-hover:text-[#C6B39A] transition-colors">
              {label}
            </h4>
          </div>
          <p className="text-xs text-[#7B694E] font-sans">
            {subtitle}
          </p>
        </div>

        {/* Right: Value (Mono) + Trend Indicator */}
        <div className="flex items-baseline sm:items-center justify-between sm:justify-end gap-3 self-end sm:self-auto">
          {trend !== 'neutral' && (
            <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded ${
              trend === 'up'
                ? 'text-[#C6B39A] bg-[#7B694E]/20 border border-[#7B694E]/30'
                : 'text-[#B85558] bg-[#8D3A3C]/20 border border-[#8D3A3C]/40'
            }`}>
              {trend === 'up' ? '?' : '?'} {trendText || (trend === 'up' ? '+Healthy' : '-Risk')}
            </span>
          )}

          <div className="text-right">
            <span className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#DFD5C6]">
              {formatted}<span className="text-xs font-normal text-[#7B694E] ml-1">{unit}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Thin Hairline Progress Bar */}
      {typeof progressPercent === 'number' && (
        <div className="mt-3">
          <div className="h-[2px] w-full bg-[#3B1319] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 rounded-full ${getProgressBg()}`}
              style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};