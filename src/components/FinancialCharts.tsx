import React, { useState } from 'react';
import { CurrentFinancialState } from '../types/finance';

interface FinancialChartsProps {
  current: CurrentFinancialState;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ current }) => {
  const [activeMonthHover, setActiveMonthHover] = useState<number | null>(null);

  // Income vs Expense breakdown data (past 6 months)
  const monthlyCashflowHistory = [
    { month: 'Apr', income: 58000, expense: 40000 },
    { month: 'May', income: 60000, expense: 41500 },
    { month: 'Jun', income: 60000, expense: 43000 },
    { month: 'Jul', income: 62000, expense: 42000 },
    { month: 'Aug', income: 60000, expense: 41000 },
    { month: 'Sep', income: current.income, expense: current.expenses },
  ];

  // Future 12-Month Balance Forecast (Baseline vs Stressed)
  const forecastData = [
    { month: 'Sep 26', baseline: 380000, stressed: 338000 },
    { month: 'Oct 26', baseline: 398000, stressed: 296000 },
    { month: 'Nov 26', baseline: 416000, stressed: 254000 },
    { month: 'Dec 26', baseline: 434000, stressed: 212000 },
    { month: 'Jan 27', baseline: 452000, stressed: 170000 },
    { month: 'Feb 27', baseline: 470000, stressed: 140000 },
  ];

  const maxForecast = 500000;
  const minForecast = 100000;
  const chartW = 540;
  const chartH = 160;
  const padX = 40;
  const padY = 20;

  const getX = (idx: number) => padX + (idx / (forecastData.length - 1)) * (chartW - padX * 2);
  const getY = (val: number) => chartH - padY - ((val - minForecast) / (maxForecast - minForecast)) * (chartH - padY * 2);

  const baselinePoints = forecastData.map((d, i) => `${getX(i)},${getY(d.baseline)}`).join(' ');
  const stressedPoints = forecastData.map((d, i) => `${getX(i)},${getY(d.stressed)}`).join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Income vs Expense Ledger Breakdown */}
      <div className="rounded-xl bg-[#3B1319]/80 border border-[#C6B39A]/20 p-5 sm:p-6 shadow-ledger backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#C6B39A]/15">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E] block">
              Ledger Distribution
            </span>
            <h4 className="font-serif text-base sm:text-lg font-medium text-[#DFD5C6]">
              Income vs Expenses
            </h4>
          </div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#280B0F] text-[#C6B39A] border border-[#7B694E]/30">
            {current.savingsRate}% Surplus Margin
          </span>
        </div>

        {/* Bar comparison */}
        <div className="space-y-3.5 pt-2">
          {monthlyCashflowHistory.map((m, idx) => {
            const incW = (m.income / 70000) * 100;
            const expW = (m.expense / 70000) * 100;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-serif text-[#DFD5C6] font-medium">{m.month}</span>
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-[#C6B39A]">In: ?{(m.income / 1000).toFixed(0)}k</span>
                    <span className="text-[#B85558]">Out: ?{(m.expense / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Inflow Bar (Camel) */}
                  <div className="h-1.5 w-full bg-[#280B0F] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7B694E] to-[#C6B39A] rounded-full"
                      style={{ width: `${incW}%` }}
                    />
                  </div>
                  {/* Outflow Bar (Rubine) */}
                  <div className="h-1.5 w-full bg-[#280B0F] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8D3A3C] rounded-full"
                      style={{ width: `${expW}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#C6B39A]/10 flex items-center justify-between text-[11px] font-mono text-[#7B694E]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-[#C6B39A] inline-block" />
            <span className="text-[#DFD5C6]">Monthly Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-[#8D3A3C] inline-block" />
            <span className="text-[#B85558]">Monthly Outflow</span>
          </div>
        </div>
      </div>

      {/* 2. Future Balance Forecast Line Chart */}
      <div className="rounded-xl bg-[#3B1319]/80 border border-[#C6B39A]/20 p-5 sm:p-6 shadow-ledger backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#C6B39A]/15">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E] block">
                Forward Horizon Forecast
              </span>
              <h4 className="font-serif text-base sm:text-lg font-medium text-[#DFD5C6]">
                Future Balance Projection
              </h4>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#280B0F] text-[#DFD5C6] border border-[#7B694E]/30">
              6-Month Ledger Curve
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="relative overflow-x-auto my-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[360px] overflow-visible">
              <defs>
                <linearGradient id="chartStressedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8D3A3C" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8D3A3C" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.5, 1].map((r, i) => {
                const y = chartH - padY - r * (chartH - padY * 2);
                const val = minForecast + r * (maxForecast - minForecast);
                return (
                  <g key={i}>
                    <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#7B694E" strokeOpacity="0.25" strokeDasharray="3 3" />
                    <text x={padX - 6} y={y + 3} fill="#7B694E" fontSize="9" textAnchor="end" fontFamily="monospace">
                      ?{(val / 100000).toFixed(1)}L
                    </text>
                  </g>
                );
              })}

              {/* Stressed Area */}
              <polygon
                points={`${getX(0)},${chartH - padY} ${stressedPoints} ${getX(forecastData.length - 1)},${chartH - padY}`}
                fill="url(#chartStressedFill)"
              />

              {/* Baseline Line (Camel Coat Dashed) */}
              <polyline
                fill="none"
                stroke="#C6B39A"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={baselinePoints}
              />

              {/* Stressed Line (Rubine Solid) */}
              <polyline
                fill="none"
                stroke="#8D3A3C"
                strokeWidth="2.5"
                points={stressedPoints}
              />

              {/* Dots & Labels */}
              {forecastData.map((d, i) => {
                const x = getX(i);
                const isHov = activeMonthHover === i;
                return (
                  <g key={i} className="cursor-pointer" onMouseEnter={() => setActiveMonthHover(i)} onMouseLeave={() => setActiveMonthHover(null)}>
                    {isHov && (
                      <line x1={x} y1={padY} x2={x} y2={chartH - padY} stroke="#C6B39A" strokeWidth="1" strokeDasharray="2 2" />
                    )}
                    <circle cx={x} cy={getY(d.baseline)} r={isHov ? 5 : 3.5} fill="#C6B39A" stroke="#280B0F" strokeWidth="1.5" />
                    <circle cx={x} cy={getY(d.stressed)} r={isHov ? 5 : 3.5} fill="#8D3A3C" stroke="#280B0F" strokeWidth="1.5" />
                    <text x={x} y={chartH - padY + 14} fill={isHov ? '#DFD5C6' : '#7B694E'} fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {d.month.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-[#C6B39A]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#C6B39A] inline-block" />
              <span className="text-[#DFD5C6]">Baseline Growth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#8D3A3C] inline-block" />
              <span className="text-[#B85558]">Job Loss Trajectory</span>
            </div>
          </div>

          {activeMonthHover !== null && (
            <span className="text-[#C6B39A] bg-[#280B0F] px-2 py-0.5 rounded border border-[#7B694E]/30">
              {forecastData[activeMonthHover].month}: ?{(forecastData[activeMonthHover].baseline / 100000).toFixed(2)}L vs ?{(forecastData[activeMonthHover].stressed / 100000).toFixed(2)}L
            </span>
          )}
        </div>
      </div>
    </div>
  );
};