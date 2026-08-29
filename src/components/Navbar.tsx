import React from 'react';
import { ShieldCheck, Activity, SlidersHorizontal, MessageSquareText } from 'lucide-react';
import { FinancialMetrics } from '../types/finance';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  metrics: FinancialMetrics;
  isStressed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, metrics, isStressed }) => {
  const getResilienceColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b12]/85 border-b border-surface-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-glow-emerald group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Finance<span className="text-emerald-400">Guard</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Twin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Stress Testing & AI Copilot</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-surface-border shadow-inner">
            <button
              onClick={() => navigate('/simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentRoute === '/simulator'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>What-If Simulator</span>
            </button>

            <button
              onClick={() => navigate('/copilot')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentRoute === '/copilot'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>AI Copilot</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </button>
          </nav>

          {/* Right Live Twin Badge */}
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${getResilienceColor(metrics.resilience)}`}>
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Twin Resilience:</span>
              <span className="font-mono text-sm font-bold">{metrics.resilience}/100</span>
              {isStressed && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  Simulated
                </span>
              )}
            </div>

            <div className="text-right hidden md:block">
              <span className="text-[11px] text-slate-400 block">Runway</span>
              <span className="font-mono text-xs font-semibold text-slate-200">{metrics.runwayMonths} mo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
