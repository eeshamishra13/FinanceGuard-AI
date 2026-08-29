import React from 'react';
import { 
  SlidersHorizontal, 
  MessageSquareText, 
  Sparkles, 
  ArrowRight, 
  Zap 
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-glow-emerald">
          <Sparkles className="w-3.5 h-3.5" />
          <span>48-Hour Hackathon • Autonomous Financial Resilience Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Anticipate Financial Shocks with your <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Financial Twin</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          FinanceGuard stress-tests your finances against job loss, rent spikes, and emergencies — then prescribes deterministic recovery levers before crisis strikes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/simulator')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider hover:brightness-110 shadow-glow-emerald transition-all flex items-center justify-center gap-2.5 active:scale-95"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Launch What-If Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/copilot')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-surface border border-surface-border text-slate-200 font-bold text-sm hover:border-cyan-500/40 hover:bg-surface-elevated transition-all flex items-center justify-center gap-2.5"
          >
            <MessageSquareText className="w-5 h-5 text-cyan-400" />
            <span>Open AI Copilot</span>
          </button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Simulator Launcher Card */}
        <div 
          onClick={() => navigate('/simulator')}
          className="rounded-3xl bg-gradient-to-br from-[#0e1828] to-[#0a101b] border border-surface-border p-8 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <SlidersHorizontal className="w-6 h-6" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Core Module 01
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-emerald-300 transition-colors">
            What-If Scenario Simulator
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Simulate 5 deterministic shock scenarios (Job Loss, Rent Surge, Medical Shock, Discretionary Trim) with real-time Before/After diffs, 6-month timelines, and interactive recovery levers.
          </p>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Explore /simulator</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Copilot Launcher Card */}
        <div 
          onClick={() => navigate('/copilot')}
          className="rounded-3xl bg-gradient-to-br from-[#0a1727] to-[#070f1a] border border-surface-border p-8 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
            <MessageSquareText className="w-6 h-6" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
            Core Module 02
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-cyan-300 transition-colors">
            AI Twin Copilot & Diagnosis
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Query your Financial Twin for instant deterministic diagnosis: purchasing decisions (laptop affordability), runway survival calculations, resilience scoring, and benchmark targets.
          </p>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Explore /copilot</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Key Architecture Callout */}
      <section className="rounded-3xl bg-surface-card border border-surface-border p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-amber-400" />
          <h3 className="font-bold text-lg text-white">48-Hour Hackathon Architecture Isolation</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
            <span className="text-emerald-400 font-bold block mb-1 font-sans">1. Mock Financial Engine:</span>
            <code>lib/simulatorService.ts</code>
            <p className="text-slate-400 text-[11px] font-sans mt-1">
              Deterministic stress test formulas, runway calculations, 6-month timelines & recovery levers.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
            <span className="text-cyan-400 font-bold block mb-1 font-sans">2. Mock AI Diagnostic Copilot:</span>
            <code>lib/copilotMock.ts</code>
            <p className="text-slate-400 text-[11px] font-sans mt-1">
              Deterministic question-answer generation, purchase validation, and risk verdicts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
