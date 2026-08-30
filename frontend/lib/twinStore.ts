import type {
  FinancialTwinCore,
  WaterfallTiers,
  ExposureVector,
  MonteCarloRunwayResult,
  SensitivityTornadoItem,
  DecisionOptimizationResult,
} from "@/financial-engine";
import {
  createBusinessTwin,
  createPersonalTwin,
  calculateWaterfall,
  runMonteCarloRunway,
  generateSensitivityTornado,
  optimizeLiquidityDecisions,
  DEMO_FINANCIAL_PROFILE,
} from "@/financial-engine";
import { APEX_LOGISTICS_BUSINESS_INPUT } from "@/data/demoCompany";

const TWIN_STORAGE_KEY = "financeguard_active_twin";
const SHOCK_STORAGE_KEY = "financeguard_active_shock";

export interface ActiveShockState {
  dieselPercentDelta: number;
  revenuePercentDelta: number;
  interestBpsDelta: number;
}

export const DEFAULT_SHOCK_STATE: ActiveShockState = {
  dieselPercentDelta: 0,
  revenuePercentDelta: 0,
  interestBpsDelta: 0,
};

export function getActiveTwin(): FinancialTwinCore {
  if (typeof window === "undefined") {
    return createBusinessTwin(APEX_LOGISTICS_BUSINESS_INPUT);
  }

  const stored = window.localStorage.getItem(TWIN_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  const initial = createBusinessTwin(APEX_LOGISTICS_BUSINESS_INPUT);
  window.localStorage.setItem(TWIN_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function setActiveTwin(twin: FinancialTwinCore): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TWIN_STORAGE_KEY, JSON.stringify(twin));
  }
}

export function getActiveShockState(): ActiveShockState {
  if (typeof window === "undefined") {
    return DEFAULT_SHOCK_STATE;
  }

  const stored = window.localStorage.getItem(SHOCK_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  return DEFAULT_SHOCK_STATE;
}

export function setActiveShockState(shock: ActiveShockState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SHOCK_STORAGE_KEY, JSON.stringify(shock));
  }
}

export function evaluateTwinTelemetry(
  baseTwin: FinancialTwinCore,
  shock: ActiveShockState = DEFAULT_SHOCK_STATE
): {
  baseTwin: FinancialTwinCore;
  shockedTwin: FinancialTwinCore;
  totalMonthlyImpact: number;
  waterfall: WaterfallTiers;
  monteCarlo: MonteCarloRunwayResult;
  tornado: SensitivityTornadoItem[];
  decision: DecisionOptimizationResult;
} {
  let deltaOpEx = 0;

  if (shock.dieselPercentDelta !== 0) {
    const fuelExp = baseTwin.exposures.find((e: ExposureVector) => e.category === "Fuel");
    const beta = fuelExp?.beta ?? 0.32;
    const baseSpend = fuelExp?.baselineMonthlySpend ?? baseTwin.mandatoryExpenses * 0.25;
    deltaOpEx += (shock.dieselPercentDelta / 100) * beta * baseSpend;
  }

  if (shock.interestBpsDelta !== 0) {
    const debtExp = baseTwin.exposures.find((e: ExposureVector) => e.category === "Debt Service");
    const beta = debtExp?.beta ?? 0.35;
    const baseSpend = debtExp?.baselineMonthlySpend ?? baseTwin.monthlyDebtService;
    deltaOpEx += (shock.interestBpsDelta / 10000) * beta * baseSpend;
  }

  const revenueFactor = 1 + shock.revenuePercentDelta / 100;
  const shockedInflow = Math.max(0, Math.round(baseTwin.monthlyInflow * revenueFactor));

  const totalMonthlyImpact = Math.round(deltaOpEx);
  const shockedMandatory = Math.round(baseTwin.mandatoryExpenses + deltaOpEx);
  const shockedTotalBurn = Math.round(baseTwin.totalMonthlyBurn + deltaOpEx);
  const shockedNetCashflow = shockedInflow - shockedTotalBurn;

  const shockedTwin: FinancialTwinCore = {
    ...baseTwin,
    monthlyInflow: shockedInflow,
    mandatoryExpenses: shockedMandatory,
    totalMonthlyBurn: shockedTotalBurn,
    netMonthlyCashflow: shockedNetCashflow,
  };

  const waterfall = calculateWaterfall(shockedTwin);
  const monteCarlo = runMonteCarloRunway(shockedTwin, { simulationsCount: 1000, seed: 42 });
  const tornado = generateSensitivityTornado(shockedTwin);
  const decision = optimizeLiquidityDecisions(shockedTwin);

  return {
    baseTwin,
    shockedTwin,
    totalMonthlyImpact,
    waterfall,
    monteCarlo,
    tornado,
    decision,
  };
}