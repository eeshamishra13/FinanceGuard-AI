import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './routes/HomePage';
import { DashboardPage } from './routes/DashboardPage';
import { SimulatorPage } from './routes/SimulatorPage';
import { CopilotPage } from './routes/CopilotPage';
import { DEFAULT_CURRENT } from './lib/simulatorService';
import type { DerivedMetrics, SimulationResult } from '../financial-engine/types';

const formatMetrics = (current: typeof DEFAULT_CURRENT): DerivedMetrics => ({
  totalExpenses: current.expenses,
  monthlySavings: current.savings,
  savingsRate: current.income > 0 ? (current.savings / current.income) * 100 : 0,
  monthlyBurn: current.expenses,
  netWorth: current.netWorth,
  runwayMonths: current.runwayMonths,
  resilienceScore: current.resilienceScore,
  resilienceBand: current.resilienceScore >= 80 ? 'healthy' : current.resilienceScore >= 50 ? 'warning' : 'critical',
  resilienceBreakdown: {
    emergencyFund: 30,
    savingsRate: 20,
    debtBurden: 20,
    expenseStability: 15,
    incomeStability: 15,
  },
});

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    if (hash === '/dashboard' || path === '/dashboard') return '/dashboard';
    if (hash === '/simulator' || path === '/simulator') return '/simulator';
    if (hash === '/copilot' || path === '/copilot') return '/copilot';
    return '/';
  });

  const [activeScenario, setActiveScenario] = useState<SimulationResult | null>(null);

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
      if (hash === '/dashboard' || path === '/dashboard') setCurrentRoute('/dashboard');
      else if (hash === '/simulator' || path === '/simulator') setCurrentRoute('/simulator');
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

  const liveMetrics = formatMetrics(DEFAULT_CURRENT);

  return (
    <div className="landing min-h-screen text-[var(--foreground)] font-sans flex flex-col antialiased">
      {/* Show Navbar on non-Copilot pages to prevent header duplication */}
      {currentRoute !== '/copilot' && (
        <Navbar
          currentRoute={currentRoute}
          navigate={navigate}
          current={DEFAULT_CURRENT}
        />
      )}

      <main className="flex-1 w-full mx-auto">
        {currentRoute === '/' && (
          <HomePage navigate={navigate} current={DEFAULT_CURRENT} />
        )}

        {currentRoute === '/dashboard' && (
          <DashboardPage navigate={navigate} current={DEFAULT_CURRENT} />
        )}

        {currentRoute === '/simulator' && (
          <SimulatorPage
            navigate={navigate}
            current={DEFAULT_CURRENT}
            onActiveScenarioChange={(sc: any) => {
              if (sc?.after) {
                setActiveScenario({
                  baseline: liveMetrics,
                  scenario: { ...liveMetrics, resilienceScore: sc.after.resilienceScore, runwayMonths: sc.after.runwayMonths },
                  delta: { resilience: sc.after.resilienceScore - liveMetrics.resilienceScore, runway: sc.after.runwayMonths - liveMetrics.runwayMonths },
                  narrative: { cause: sc.scenario?.title || "Simulated Shock", topFactors: ["Discretionary Cut", "Reserve Burn"] }
                });
              } else {
                setActiveScenario(null);
              }
            }}
          />
        )}

        {currentRoute === '/copilot' && (
          <CopilotPage
            navigate={navigate}
            metrics={liveMetrics}
            activeScenario={activeScenario}
          />
        )}
      </main>

      <footer className="site-footer">
        <div>
          <span className="wordmark">FINANCE<span>GUARD</span></span>
          <span className="ml-3">• AUTONOMOUS DIGITAL TWIN</span>
        </div>
        <div>
          <span>DETERMINISTIC ENGINE + AI COPILOT</span>
        </div>
      </footer>
    </div>
  );
};