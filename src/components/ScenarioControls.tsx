import React from 'react';
import { ScenarioType } from '../types/finance';
import { Play, RotateCcw } from 'lucide-react';

interface ScenarioControlsProps {
  scenarioType: ScenarioType;
  params: Record<string, any>;
  onParamChange: (key: string, value: any) => void;
  onResetParams: () => void;
  onRunStressTest: () => void;
  isCalculating: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  scenarioType,
  params,
  onParamChange,
  onResetParams,
  onRunStressTest,
  isCalculating,
}) => {
  return (
    <div className="rounded-2xl bg-surface-elevated/90 border border-surface-border p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Step 2: Calibrate Variables
          </span>
          <h3 className="font-bold text-lg text-white">Scenario Parameters</h3>
        </div>
        <button
          onClick={onResetParams}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Dynamic Controls depending on selected scenario */}
      <div className="space-y-5">
        {scenarioType === 'job_loss' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Income Loss Severity:</span>
                <span className="font-mono text-rose-400 text-sm font-bold bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/20">
                  {params.incomeDropPercent ?? 100}% Loss (-₹{Math.round(105000 * ((params.incomeDropPercent ?? 100) / 100)).toLocaleString('en-IN')}/mo)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={params.incomeDropPercent ?? 100}
                onChange={(e) => onParamChange('incomeDropPercent', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>10% (Minor Pay Cut)</span>
                <span>50% (Half Salary)</span>
                <span>100% (Complete Layoff)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Unemployment Duration:</span>
                <span className="font-mono text-amber-400 text-sm font-bold bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {params.durationMonths ?? 4} Months
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={params.durationMonths ?? 4}
                onChange={(e) => onParamChange('durationMonths', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>1 Month</span>
                <span>4 Months (Avg Search)</span>
                <span>12 Months</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Severance or Gratuity Payout (Optional):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onParamChange('severancePay', amt)}
                    className={`py-2 px-2 text-xs font-mono rounded-lg border transition-all ${
                      (params.severancePay ?? 0) === amt
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                    }`}
                  >
                    {amt === 0 ? 'None' : `+₹${(amt / 1000).toFixed(0)}k`}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {scenarioType === 'rent_increase' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Monthly Rent Increase:</span>
                <span className="font-mono text-rose-400 text-sm font-bold bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/20">
                  +₹{Number(params.rentIncreaseAmount ?? 12000).toLocaleString('en-IN')}/month
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="1000"
                value={params.rentIncreaseAmount ?? 12000}
                onChange={(e) => onParamChange('rentIncreaseAmount', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>+₹2,000/mo</span>
                <span>+₹12,000/mo</span>
                <span>+₹30,000/mo</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Common Lease Escalation Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '5% Inflation', val: 3500 },
                  { label: 'City Relocation', val: 12000 },
                  { label: 'Prime Upgrade', val: 20000 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => onParamChange('rentIncreaseAmount', p.val)}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all ${
                      Number(params.rentIncreaseAmount) === p.val
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-medium">{p.label}</span>
                    <span className="font-mono text-[10px] text-slate-500">+₹{p.val.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {scenarioType === 'emergency_expense' && (
          <>
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Unplanned Emergency Shock:</span>
                <span className="font-mono text-rose-400 text-sm font-bold bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-500/20">
                  ₹{Number(params.expenseAmount ?? 150000).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="25000"
                max="400000"
                step="25000"
                value={params.expenseAmount ?? 150000}
                onChange={(e) => onParamChange('expenseAmount', Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>₹25,000</span>
                <span>₹1,50,000 (Medical)</span>
                <span>₹4,00,000</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Emergency Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Hospital / Medical', 'Home Structural', 'Vehicle Engine', 'Family Emergency'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onParamChange('category', cat)}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all ${
                      (params.category ?? 'Hospital / Medical') === cat
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {scenarioType === 'income_boost' && (
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-300">Additional Monthly Inflow:</span>
              <span className="font-mono text-emerald-400 text-sm font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-500/20">
                +₹{Number(params.additionalIncome ?? 25000).toLocaleString('en-IN')}/month
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="60000"
              step="5000"
              value={params.additionalIncome ?? 25000}
              onChange={(e) => onParamChange('additionalIncome', Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>+₹5,000/mo</span>
              <span>+₹25,000/mo</span>
              <span>+₹60,000/mo</span>
            </div>
          </div>
        )}

        {scenarioType === 'cut_spending' && (
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-300">Monthly Spending Reduction:</span>
              <span className="font-mono text-emerald-400 text-sm font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-500/20">
                -₹{Number(params.monthlyCutAmount ?? 10000).toLocaleString('en-IN')}/month
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="25000"
              step="1000"
              value={params.monthlyCutAmount ?? 10000}
              onChange={(e) => onParamChange('monthlyCutAmount', Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>-₹2,000/mo</span>
              <span>-₹10,000/mo</span>
              <span>-₹25,000/mo</span>
            </div>
          </div>
        )}
      </div>

      {/* RUN STRESS TEST Button */}
      <div className="mt-6 pt-5 border-t border-surface-border">
        <button
          onClick={onRunStressTest}
          disabled={isCalculating}
          className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
            isCalculating
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 hover:shadow-glow-emerald active:scale-[0.99]'
          }`}
        >
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Simulating Financial Shockwave...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950" />
              <span>RUN STRESS TEST</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
