import React from 'react';
import { ResilienceGauge } from '../components/ResilienceGauge';
import { CurrentFinancialState } from '../types/finance';
import { ArrowRight, SlidersHorizontal, LayoutDashboard, Sparkles } from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
  current: CurrentFinancialState;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate, current }) => {
  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* 1. HERO SECTION */}
      <section className="relative max-w-5xl mx-auto text-center space-y-8">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-[#8D3A3C]/20 via-[#7B694E]/15 to-[#C6B39A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Ledger Seal */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3B1319] border border-[#C6B39A]/30 text-xs font-mono text-[#C6B39A] shadow-glow-camel relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-[#C6B39A]" />
          <span>AI-POWERED FINANCIAL DIGITAL TWIN</span>
        </div>

        {/* Big Characterful Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#DFD5C6] tracking-tight leading-[1.12] relative z-10">
          Your financial future, <br className="hidden sm:inline" />
          <span className="italic text-[#C6B39A] underline decoration-[#7B694E]/50 decoration-1 underline-offset-8">
            stress-tested
          </span>{' '}
          before it happens.
        </h1>

        {/* Subtext explaining product in one sentence */}
        <p className="font-sans text-base sm:text-lg text-[#C6B39A]/90 max-w-2xl mx-auto leading-relaxed relative z-10">
          FinanceGuard creates an autonomous digital twin of your personal ledger to simulate macro shocks, sudden layoffs, and life transitions before crisis strikes.
        </p>

        {/* Signature Visual: Animated Circular Resilience Gauge */}
        <div className="py-6 flex flex-col items-center justify-center relative z-10">
          <div className="p-6 rounded-2xl bg-[#3B1319]/60 border border-[#C6B39A]/20 shadow-ledger backdrop-blur-md">
            <ResilienceGauge score={current.resilienceScore} size={250} strokeWidth={14} />
          </div>
          <p className="font-mono text-xs text-[#7B694E] mt-3">
            Active Digital Twin Solvency Rating: <strong className="text-[#C6B39A]">Prime Ledger Class</strong>
          </p>
        </div>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/simulator')}
            className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#C6B39A] text-[#280B0F] font-mono font-bold text-sm uppercase tracking-wider hover:bg-[#DFD5C6] shadow-glow-camel transition-all flex items-center justify-center gap-2 group"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Enter the Simulation Lab</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#3B1319] text-[#DFD5C6] border border-[#C6B39A]/30 font-mono text-sm hover:bg-[#7B694E]/25 transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-[#C6B39A]" />
            <span>View Dashboard</span>
          </button>
        </div>
      </section>

      {/* 2. BOUTIQUE LEDGER HIGHLIGHTS */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl bg-[#3B1319]/70 border border-[#C6B39A]/15 shadow-ledger space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B694E] block">
            Phase 01 ? Telemetry
          </span>
          <h3 className="font-serif text-lg font-medium text-[#DFD5C6]">
            Financial Digital Twin
          </h3>
          <p className="font-sans text-xs text-[#C6B39A]/80 leading-relaxed">
            Constructs a baseline model of your recurring cash flows, fixed housing debt, and liquid emergency reserves.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#3B1319]/70 border border-[#C6B39A]/15 shadow-ledger space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#8D3A3C] block">
            Phase 02 ? Stress Test
          </span>
          <h3 className="font-serif text-lg font-medium text-[#DFD5C6]">
            Simulation Lab
          </h3>
          <p className="font-sans text-xs text-[#C6B39A]/80 leading-relaxed">
            Instantly run What-If shocks: job loss, pay cuts, rent surges, and lump sum emergency outlays with real-time before/after diffs.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#3B1319]/70 border border-[#C6B39A]/15 shadow-ledger space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#C6B39A] block">
            Phase 03 ? Action
          </span>
          <h3 className="font-serif text-lg font-medium text-[#DFD5C6]">
            Prescriptive Recovery
          </h3>
          <p className="font-sans text-xs text-[#C6B39A]/80 leading-relaxed">
            Prescribes concrete recovery levers to neutralize cash flow deficits and restore your resilience score.
          </p>
        </div>
      </section>
    </div>
  );
};