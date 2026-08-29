import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SimulatorPage } from './routes/SimulatorPage';
import { CopilotPage } from './routes/CopilotPage';
import { HomePage } from './routes/HomePage';
import { BASELINE_METRICS } from './lib/simulatorService';
import { FinancialMetrics, StressTestResult } from './types/finance';

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    if (hash === '/simulator' || path === '/simulator') return '/simulator';
    if (hash === '/copilot' || path === '/copilot') return '/copilot';
    return '/';
  });

  const [activeScenario, setActiveScenario] = useState<StressTestResult | null>(null);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      if (hash === '/simulator' || path === '/simulator') setCurrentRoute('/simulator');
      else if (hash === '/copilot' || path === '/copilot') setCurrentRoute('/copilot');
      else setCurrentRoute('/');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const currentMetrics: FinancialMetrics = activeScenario ? activeScenario.after : BASELINE_METRICS;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        metrics={currentMetrics}
        isStressed={!!activeScenario}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentRoute === '/simulator' && (
          <SimulatorPage
            navigate={navigate}
            onUpdateStressedState={setActiveScenario}
            activeTestResult={activeScenario}
          />
        )}

        {currentRoute === '/copilot' && (
          <CopilotPage
            navigate={navigate}
            metrics={currentMetrics}
            activeScenario={activeScenario}
          />
        )}

        {currentRoute === '/' && (
          <HomePage navigate={navigate} />
        )}
      </main>

      <footer className="border-t border-surface-border/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FinanceGuard — 48h Hackathon Architecture (Person 3 Deliverable)</span>
          <span className="font-mono text-[11px] text-slate-600">
            Routes: /simulator • /copilot • Pure Deterministic Engine
          </span>
        </div>
      </footer>
    </div>
  );
};
