import React, { useState } from 'react';
import { TimelinePoint } from '../types/finance';
import { LineChart } from 'lucide-react';

interface ProjectionChartProps {
  timeline: TimelinePoint[];
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({ timeline }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!timeline || timeline.length === 0) return null;

  const maxVal = 500000;
  const minVal = 100000;
  const chartW = 580;
  const chartH = 180;
  const padX = 45;
  const padY = 25;

  const getX = (i: number) => padX + (i / (timeline.length - 1)) * (chartW - padX * 2);
  const getY = (val: number) => chartH - padY - ((val - minVal) / (maxVal - minVal)) * (chartH - padY * 2);

  const points = timeline.map((p, i) => `${getX(i)},${getY(p.balance)}`).join(' ');
  const areaPoints = `${getX(0)},${chartH - padY} ${points} ${getX(timeline.length - 1)},${chartH - padY}`;

  return (
    <div className="rounded-xl bg-[#3B1319]/80 border border-[#C6B39A]/20 p-5 shadow-ledger backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#C6B39A]/15">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-[#C6B39A]" />
          <h4 className="font-serif text-base font-medium text-[#DFD5C6]">
            Simulated 6-Month Asset Trajectory
          </h4>
        </div>
        <span className="font-mono text-xs text-[#7B694E]">
          Ledger Forecast
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[380px] overflow-visible">
          <defs>
            <linearGradient id="simAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8D3A3C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8D3A3C" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0, 0.5, 1].map((r, i) => {
            const y = chartH - padY - r * (chartH - padY * 2);
            const val = minVal + r * (maxVal - minVal);
            return (
              <g key={i}>
                <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#7B694E" strokeOpacity="0.2" strokeDasharray="3 3" />
                <text x={padX - 6} y={y + 3} fill="#7B694E" fontSize="9" textAnchor="end" fontFamily="monospace">
                  ?{(val / 100000).toFixed(1)}L
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <polygon points={areaPoints} fill="url(#simAreaGrad)" />

          {/* Line */}
          <polyline fill="none" stroke="#8D3A3C" strokeWidth="2.5" points={points} />

          {/* Data Points */}
          {timeline.map((p, i) => {
            const x = getX(i);
            const y = getY(p.balance);
            const isHov = hoveredIdx === i;

            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                {isHov && (
                  <line x1={x} y1={padY} x2={x} y2={chartH - padY} stroke="#C6B39A" strokeWidth="1" strokeDasharray="2 2" />
                )}
                <circle cx={x} cy={y} r={isHov ? 5 : 3.5} fill="#8D3A3C" stroke="#280B0F" strokeWidth="1.5" />
                <text x={x} y={chartH - padY + 14} fill={isHov ? '#DFD5C6' : '#7B694E'} fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {p.monthName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredIdx !== null && (
        <div className="mt-3 pt-2 border-t border-[#C6B39A]/10 text-xs font-mono text-right text-[#C6B39A]">
          {timeline[hoveredIdx].monthName}: ?{timeline[hoveredIdx].balance.toLocaleString('en-IN')} (Resilience: {timeline[hoveredIdx].resilience}/100)
        </div>
      )}
    </div>
  );
};