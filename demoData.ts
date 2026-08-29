import type { FinancialProfile, SimulationScenario } from "./types.ts";

/**
 * Realistic Indian financial profile for demo and baseline calculations.
 * Characteristics:
 * - Total Income: ₹65,000/mo (₹60k salary + ₹5k side gig)
 * - Essential Expenses: ₹32,000/mo
 * - Discretionary Expenses: ₹10,000/mo
 * - Emergency Fund: ₹4,00,000 (10.8 months runway)
 * - Savings: ₹1,50,000
 * - Investments: ₹1,00,000
 * - Debt: ₹50,000
 * - Monthly EMI: ₹5,000
 * - Resilience Score: ~89 ("healthy" band)
 */
export const DEMO_FINANCIAL_PROFILE: FinancialProfile = {
  income: 60000,
  otherIncome: 5000,
  essentialExpenses: 32000,
  discretionaryExpenses: 10000,
  emergencyFund: 400000,
  savings: 150000,
  investments: 100000,
  debt: 50000,
  monthlyDebtPayment: 5000,
};

/**
 * Scenario: 3-month sudden job loss (100% income drop with 3-month recovery duration).
 */
export const JOB_LOSS_3_MONTHS: SimulationScenario = {
  incomeChangePercent: -100,
  durationMonths: 3,
};

/**
 * Scenario: 15% increase in rent and essential household expenses.
 */
export const RENT_INCREASE_15_PERCENT: SimulationScenario = {
  rentChangePercent: 15,
};

/**
 * Scenario: ₹50,000 sudden medical or appliance emergency expense.
 */
export const EMERGENCY_EXPENSE_50K: SimulationScenario = {
  unexpectedExpense: 50000,
};

/**
 * Scenario: 20% salary hike / promotion.
 */
export const INCOME_INCREASE_20_PERCENT: SimulationScenario = {
  incomeChangePercent: 20,
};

/**
 * Scenario: Discretionary spend optimization saving ₹5,000/mo.
 */
export const REDUCE_DISCRETIONARY_5K: SimulationScenario = {
  discretionaryReductionAmount: 5000,
};

export interface PresetScenarioItem {
  id: string;
  label: string;
  scenario: SimulationScenario;
}

export const PRESET_SCENARIO_REGISTRY: PresetScenarioItem[] = [
  {
    id: "job_loss",
    label: "3-Month Job Loss",
    scenario: JOB_LOSS_3_MONTHS,
  },
  {
    id: "rent_hike",
    label: "15% Rent Increase",
    scenario: RENT_INCREASE_15_PERCENT,
  },
  {
    id: "emergency",
    label: "₹50,000 Emergency",
    scenario: EMERGENCY_EXPENSE_50K,
  },
  {
    id: "income_increase",
    label: "20% Income Increase",
    scenario: INCOME_INCREASE_20_PERCENT,
  },
  {
    id: "reduce_discretionary",
    label: "Reduce Discretionary by ₹5,000",
    scenario: REDUCE_DISCRETIONARY_5K,
  },
];

/**
 * Getter function for preset scenarios so Persons 2 & 3 can easily render preset cards.
 */
export const getPresetScenarios = (): PresetScenarioItem[] =>
  PRESET_SCENARIO_REGISTRY;
