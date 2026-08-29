import React from 'react';
import { ShieldCheck, SlidersHorizontal, MessageSquareText, LayoutDashboard, Sparkles } from 'lucide-react';
import { CurrentFinancialState } from '../types/finance';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  current: CurrentFinancialState;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, current }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#280B0F]/90 border-b border-[#C6B39A]/15 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#3B1319] border border-[#C6B39A]/40 flex items-center justify-center text-[#C6B39A] group-hover:border-[#C6B39A] transition-all shadow-glow-camel">
              <ShieldCheck className="w-5 h-5 text-[#C6B39A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-lg tracking-tight text-[#DFD5C6] group-hover:text-[#C6B39A] transition-colors">
                  Finance<span className="text-[#C6B39A] italic">Guard</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded bg-[#3B1319] text-[#C6B39A] border border-[#7B694E]/40">
                  DIGITAL TWIN
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#7B694E] -mt-0.5">Private Wealth Resilience</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 p-1 bg-[#3B1319]/70 rounded-lg border border-[#C6B39A]/15">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                currentRoute === '/'
                  ? 'bg-[#280B0F] text-[#C6B39A] border border-[#C6B39A]/30 font-semibold'
                  : 'text-[#7B694E] hover:text-[#DFD5C6]'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                currentRoute === '/dashboard'
                  ? 'bg-[#280B0F] text-[#C6B39A] border border-[#C6B39A]/30 font-semibold'
                  : 'text-[#7B694E] hover:text-[#DFD5C6]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                currentRoute === '/simulator'
                  ? 'bg-[#280B0F] text-[#C6B39A] border border-[#C6B39A]/30 font-semibold'
                  : 'text-[#7B694E] hover:text-[#DFD5C6]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Simulation Lab</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/copilot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                currentRoute === '/copilot'
                  ? 'bg-[#280B0F] text-[#C6B39A] border border-[#C6B39A]/30 font-semibold'
                  : 'text-[#7B694E] hover:text-[#DFD5C6]'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
          </nav>

          {/* Right Live Twin Badge */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#3B1319] border border-[#C6B39A]/20 text-xs font-mono">
              <span className="text-[#7B694E]">Twin Resilience:</span>
              <span className="font-bold text-[#C6B39A]">{current.resilienceScore}/100</span>
              <span className="text-[#7B694E]">?</span>
              <span className="text-[#DFD5C6]">{current.runwayMonths} mo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};