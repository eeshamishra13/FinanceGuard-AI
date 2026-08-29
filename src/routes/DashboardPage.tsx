import React from 'react';
import { CurrentFinancialState } from '../types/finance';
import { LedgerRow } from '../components/LedgerRow';
import { FinancialCharts } from '../components/FinancialCharts';
import { SlidersHorizontal, ArrowRight, ShieldCheck, Sparkles, Activity } from 'lucide-react';

interface DashboardPageProps {
  navigate: (route: string) => void;
  current: CurrentFinancialState;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate, current }) => {
  return (
    <div className="space-y-10 py-4 sm:py-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C6B39A]/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E] font-medium">
              Private Ledger Statement
            </span>
            <span className="text-[#C6B39A]">?</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#C6B39A]">
              Active Digital Twin
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#DFD5C6] tracking-tight mt-1">
            Financial Intelligence Dashboard
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7B694E] mt-0.5">
            Real-time balance sheet ledger, monthly liquidity margins, and solvency telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/simulator')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C6B39A] text-[#280B0F] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#DFD5C6] shadow-glow-camel transition-all self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Stress-Test in Simulation Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. STACKED HORIZONTAL LEDGER BANDS CONTAINER */}
      <section className="rounded-xl bg-[#3B1319]/80 border border-[#C6B39A]/20 shadow-ledger backdrop-blur-md overflow-hidden">
        <div className="py-3.5 px-5 sm:px-6 bg-[#280B0F]/90 border-b border-[#C6B39A]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C6B39A]" />
            <h3 className="font-serif text-base font-medium text-[#DFD5C6]">
              Core Telemetry Ledger Entries
            </h3>
          </div>
          <span className="font-mono text-[11px] text-[#7B694E]">
            Currency: INR (?)
          </span>
        </div>

        <div className="divide-y divide-[#C6B39A]/10">
          <LedgerRow
            label="Net Worth"
            subtitle="Total accrued net worth buffer across liquid checking, emergency reserve & working capital"
            value={current.netWorth}
            isCurrency={true}
            trend="up"
            trendText="+?18k/mo"
            progressPercent={76}
            progressColor="camel"
          />

          <LedgerRow
            label="Monthly Inflow (Income)"
            subtitle="Gross recurring monthly compensation and client revenue streams"
            value={current.income}
            isCurrency={true}
            trend="neutral"
            progressPercent={85}
            progressColor="camel"
          />

          <LedgerRow
            label="Monthly Outflow (Expenses)"
            subtitle="Combined fixed commitments (housing, utilities, debt EMI) + discretionary overhead"
            value={current.expenses}
            isCurrency={true}
            trend="neutral"
            progressPercent={70}
            progressColor="rubine"
          />

          <LedgerRow
            label="Net Monthly Savings"
            subtitle="Net organic capital surplus channeled directly into wealth compounding"
            value={current.savings}
            isCurrency={true}
            trend="up"
            trendText="+30.0%"
            progressPercent={60}
            progressColor="camel"
          />

          <LedgerRow
            label="Savings Rate"
            subtitle="Percentage of gross monthly inflow preserved post-expenditure"
            value={current.savingsRate}
            unit="%"
            trend="up"
            trendText="Optimal"
            progressPercent={current.savingsRate * 2.5}
            progressColor="camel"
          />

          <LedgerRow
            label="Emergency Runway"
            subtitle="Survival duration in months supported by liquid cash reserves without new income"
            value={current.runwayMonths}
            unit=" months"
            trend="up"
            trendText="> 6.0 mo Target"
            progressPercent={(current.runwayMonths / 12) * 100}
            progressColor="camel"
          />

          <LedgerRow
            label="Resilience Score"
            subtitle="Weighted financial resistance index (0-100) assessing solvency, burn rate & debt leverage"
            value={`${current.resilienceScore}/100`}
            trend="up"
            trendText="Prime Grade"
            progressPercent={current.resilienceScore}
            progressColor="camel"
            isHighlighted={true}
          />
        </div>
      </section>

      {/* 2. CHARTS SECTION */}
      <section className="space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E]">
            Visualization
          </span>
          <h3 className="font-serif text-xl font-medium text-[#DFD5C6]">
            Historical & Forecast Ledger Analytics
          </h3>
        </div>

        <FinancialCharts current={current} />
      </section>
    </div>
  );
};