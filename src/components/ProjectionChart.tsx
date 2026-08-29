import React, { useState } from 'react';
import { ProjectionPoint } from '../types/finance';
import { LineChart } from 'lucide-react';

interface ProjectionChartProps {
  projections: ProjectionPoint[];
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({ projections }) => {
  const [metricMode, setMetricMode] = useState<'netWorth' | 'runway' | 'resilience'>('netWorth');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!projections || projections.length === 0) return null;

  const getValues = () => {
    switch (metricMode) {
      case 'netWorth':
        return {
          baseline: projections.map((p) => p.baselineNetWorth),
          stressed: projections.map((p) => p.stressedNetWorth),
          formatter: (v: number) => '₹' + (v / 100000).toFixed(2) + 'L',
          title: 'Net Worth Trajectory',
        };
      case 'runway':
        return {
          baseline: projections.map((p) => p.baselineRunway),
          stressed: projections.map((p) => p.stressedRunway),
          formatter: (v: number) => v.toFixed(1) + ' mo',
          title: 'Emergency Runway Trajectory',
        };
      case 'resilience':
        return {
          baseline: projections.map((p) => p.baselineResilience),
          stressed: projections.map((p) => p.stressedResilience),
          formatter: (v: number) => v.toString() + '/100',
          title: 'Resilience Score Trajectory',
        };
    }
  };

  const { baseline, stressed, formatter, title } = getValues();
  const allVals = [...baseline, ...stressed];
  const minVal = Math.min(...allVals) * 0.92;
  const maxVal = Math.max(...allVals) * 1.08 || 100;
  const range = maxVal - minVal || 1;

  const width = 680;
  const height = 220;
  const paddingX = 45;
  const paddingY = 30;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getX = (index: number) => paddingX + (index / (projections.length - 1)) * chartW;
  const getY = (val: number) => height - paddingY - ((val - minVal) / range) * chartH;

  const baselinePoints = baseline.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
  const stressedPoints = stressed.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
  const stressedAreaPoints = `${getX(0)},${height - paddingY} ${stressedPoints} ${getX(projections.length - 1)},${height - paddingY}`;

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">6-Month Forward Projection: Baseline vs Stress Scenario</p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-surface p-1 rounded-xl border border-surface-border self-start">
          <button
            onClick={() => setMetricMode('netWorth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'netWorth'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Net Worth
          </button>
          <button
            onClick={() => setMetricMode('runway')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'runway'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Runway
          </button>
          <button
            onClick={() => setMetricMode('resilience')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'resilience'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resilience
          </button>
        </div>
      </div>

      {/* SVG Projection Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[540px] overflow-visible"
        >
          <defs>
            <linearGradient id="stressedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * chartH;
            const val = minVal + ratio * range;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {formatter(val)}
                </text>
              </g>
            );
          })}

          {/* Stressed Area Fill */}
          <polygon points={stressedAreaPoints} fill="url(#stressedGrad)" />

          {/* Baseline Line */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            points={baselinePoints}
            className="transition-all duration-300"
          />

          {/* Stressed Line */}
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3"
            points={stressedPoints}
            className="transition-all duration-300"
          />

          {/* X Axis Labels and Data Dots */}
          {projections.map((p, idx) => {
            const x = getX(idx);
            const yBase = getY(baseline[idx]);
            const yStress = getY(stressed[idx]);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Baseline Dot */}
                <circle
                  cx={x}
                  cy={yBase}
                  r={isHovered ? 6 : 4}
                  fill="#10b981"
                  stroke="#090d16"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Stressed Dot */}
                <circle
                  cx={x}
                  cy={yStress}
                  r={isHovered ? 7 : 5}
                  fill="#f43f5e"
                  stroke="#090d16"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* X Axis Label */}
                <text
                  x={x}
                  y={height - paddingY + 18}
                  fill={isHovered ? '#38bdf8' : '#94a3b8'}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {p.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Active Hover Tooltip */}
      <div className="mt-4 pt-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400 inline-block"></span>
            <span className="text-slate-300 font-medium">Baseline Projection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-rose-500 rounded inline-block"></span>
            <span className="text-rose-300 font-medium">Stress-Tested Trajectory</span>
          </div>
        </div>

        {hoveredIndex !== null ? (
          <div className="flex items-center gap-3 bg-surface-elevated px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-[11px]">
            <span className="text-slate-400 font-sans">{projections[hoveredIndex].month}:</span>
            <span className="text-emerald-400">Base: {formatter(baseline[hoveredIndex])}</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">Stressed: {formatter(stressed[hoveredIndex])}</span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">Hover points to inspect month metrics</span>
        )}
      </div>
    </div>
  );
};
