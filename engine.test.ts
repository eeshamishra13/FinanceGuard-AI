import {
  calculateDerived,
  applyScenario,
  forecastTrend,
  runSimulation,
  formatINR,
  roundTo,
  safeDivide,
} from "./engine.ts";

import {
  DEMO_FINANCIAL_PROFILE,
  JOB_LOSS_3_MONTHS,
  RENT_INCREASE_15_PERCENT,
  EMERGENCY_EXPENSE_50K,
  INCOME_INCREASE_20_PERCENT,
  REDUCE_DISCRETIONARY_5K,
  getPresetScenarios,
} from "./demoData.ts";

import type { FinancialProfile, SimulationScenario } from "./types.ts";

declare const process: { exit: (code?: number) => void };

// Test assertion counters
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    testsFailed++;
  } else {
    testsPassed++;
  }
}

function assertNoInvalidNumbers(obj: unknown, path = "root") {
  if (typeof obj === "number") {
    assert(
      !isNaN(obj) && isFinite(obj),
      `Value at ${path} is a valid finite number (got ${obj})`
    );
  } else if (typeof obj === "object" && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      assertNoInvalidNumbers(value, `${path}.${key}`);
    }
  }
}

console.log("=================================================");
console.log("🧪 FINANCEGUARD COMPREHENSIVE ENGINE VERIFICATION");
console.log("=================================================\n");

// ---------------------------------------------------------------------------
// 1. SAFETY HELPERS
// ---------------------------------------------------------------------------
console.log("▶ 1. Verifying Safety Helpers...");
assert(roundTo(12.3456, 2) === 12.35, "roundTo rounds 12.3456 to 12.35");
assert(roundTo(100.4, 0) === 100, "roundTo rounds 100.4 to 100");
assert(roundTo(NaN) === 0, "roundTo(NaN) returns 0");
assert(roundTo(Infinity) === 0, "roundTo(Infinity) returns 0");
assert(roundTo(-Infinity) === 0, "roundTo(-Infinity) returns 0");
assert(safeDivide(10, 2) === 5, "safeDivide(10, 2) returns 5");
assert(safeDivide(10, 0) === 0, "safeDivide(10, 0) returns 0");
assert(safeDivide(0, 0) === 0, "safeDivide(0, 0) returns 0");
assert(safeDivide(NaN, 5) === 0, "safeDivide(NaN, 5) returns 0");
assert(safeDivide(10, NaN) === 0, "safeDivide(10, NaN) returns 0");
assert(formatINR(50000).includes("50,000"), "formatINR formats ₹50,000 correctly");
assert(formatINR(NaN) === "₹0", "formatINR(NaN) returns ₹0");
assert(formatINR(Infinity) === "₹0", "formatINR(Infinity) returns ₹0");

// ---------------------------------------------------------------------------
// 2. BASELINE DERIVED METRICS ON DEMO PROFILE
// ---------------------------------------------------------------------------
console.log("\n▶ 2. Verifying Baseline Derived Metrics...");
const baseline = calculateDerived(DEMO_FINANCIAL_PROFILE);

assert(baseline.totalExpenses === 42000, `Total expenses: ₹42,000 (got ${baseline.totalExpenses})`);
assert(baseline.monthlySavings === 23000, `Monthly savings: ₹23,000 (got ${baseline.monthlySavings})`);
assert(baseline.savingsRate === 35.38, `Savings rate: 35.38% (got ${baseline.savingsRate}%)`);
assert(baseline.monthlyBurn === 37000, `Monthly burn: ₹37,000 (got ${baseline.monthlyBurn})`);
assert(baseline.netWorth === 600000, `Net worth: ₹6,00,000 (got ${baseline.netWorth})`);
assert(baseline.runwayMonths === 10.8, `Runway: 10.8 months (got ${baseline.runwayMonths})`);
assert(baseline.resilienceScore >= 75 && baseline.resilienceScore <= 95, `Resilience score in healthy range (got ${baseline.resilienceScore})`);
assert(baseline.resilienceBand === "healthy", `Resilience band: healthy (got ${baseline.resilienceBand})`);
assert(baseline.resilienceBreakdown.emergencyFund === 30, `Emergency fund score is max 30 pts (got ${baseline.resilienceBreakdown.emergencyFund})`);
assert(baseline.resilienceBreakdown.incomeStability === 10, `Income stability score is 10 pts (got ${baseline.resilienceBreakdown.incomeStability})`);
assertNoInvalidNumbers(baseline, "baselineMetrics");

// ---------------------------------------------------------------------------
// 3. UNEXPECTED EXPENSE DRAWDOWN HIERARCHY (FIX 1)
// ---------------------------------------------------------------------------
console.log("\n▶ 3. Verifying Unexpected Expense Drawdown Hierarchy...");

// Test 3A: Expense > Emergency Fund (Depletes EF first, then Savings, Clamps at 0)
const profile3A: FinancialProfile = {
  income: 50000,
  otherIncome: 0,
  essentialExpenses: 20000,
  discretionaryExpenses: 5000,
  emergencyFund: 20000,
  savings: 30000,
  investments: 100000,
  debt: 10000,
  monthlyDebtPayment: 2000,
};
const result3A = applyScenario(profile3A, { unexpectedExpense: 100000 });
const metrics3A = calculateDerived(result3A);

assert(result3A.emergencyFund === 0, "Test 3A: EF depleted to 0");
assert(result3A.savings === 0, "Test 3A: Savings depleted to 0");
assert(result3A.investments === 100000, "Test 3A: Investments untouched at ₹100,000");
assert(result3A.emergencyFund >= 0 && result3A.savings >= 0, "Test 3A: Liquid assets non-negative");
assert(metrics3A.netWorth === 90000, `Test 3A: Net worth reflects ₹50,000 liquid drawdown (got ${metrics3A.netWorth})`);

// Test 3B: Expense == Emergency Fund
const result3B = applyScenario(profile3A, { unexpectedExpense: 20000 });
assert(result3B.emergencyFund === 0, "Test 3B: EF becomes 0");
assert(result3B.savings === 30000, "Test 3B: Savings untouched at ₹30,000");

// Test 3C: Expense < Emergency Fund
const profile3C: FinancialProfile = { ...profile3A, emergencyFund: 50000 };
const result3C = applyScenario(profile3C, { unexpectedExpense: 20000 });
assert(result3C.emergencyFund === 30000, "Test 3C: EF reduced to ₹30,000");
assert(result3C.savings === 30000, "Test 3C: Savings untouched at ₹30,000");

// ---------------------------------------------------------------------------
// 4. SAFE durationMonths NORMALIZATION (FIX 2)
// ---------------------------------------------------------------------------
console.log("\n▶ 4. Verifying Safe durationMonths Handling...");

// Standard 3-month job loss
const simJobLoss = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: 3 });
assert(simJobLoss.monthlyProjection.scenario[0].netWorth < simJobLoss.monthlyProjection.baseline[0].netWorth, "Job loss drops NW in month 1");
assert(simJobLoss.monthlyProjection.scenario[3].resilience > simJobLoss.monthlyProjection.scenario[2].resilience, "Month 4 recovers after duration ends");

// Duration = 0
const simDur0 = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: 0 });
assert(simDur0.monthlyProjection.scenario.length === 6, "duration=0 generates 6 points without crash");
assertNoInvalidNumbers(simDur0, "simDur0");

// Negative Duration
const simDurNeg = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -50, durationMonths: -3 });
assert(simDurNeg.monthlyProjection.scenario.length === 6, "duration=-3 generates 6 points without crash");
assertNoInvalidNumbers(simDurNeg, "simDurNeg");

// Non-integer Duration
const simDurFloat = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: 2.5 });
assert(simDurFloat.monthlyProjection.scenario.length === 6, "duration=2.5 generates 6 points without crash");
assertNoInvalidNumbers(simDurFloat, "simDurFloat");

// Extremely large Duration
const simDurBig = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: 10000 });
assert(simDurBig.monthlyProjection.scenario.length === 6, "duration=10000 generates 6 points without crash");
assertNoInvalidNumbers(simDurBig, "simDurBig");

// NaN / Infinity Duration
const simDurNaN = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: NaN });
const simDurInf = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: Infinity });
const simDurNegInf = runSimulation(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -100, durationMonths: -Infinity });
assert(simDurNaN.monthlyProjection.scenario.length === 6, "duration=NaN safe");
assert(simDurInf.monthlyProjection.scenario.length === 6, "duration=Infinity safe");
assert(simDurNegInf.monthlyProjection.scenario.length === 6, "duration=-Infinity safe");
assertNoInvalidNumbers(simDurNaN, "simDurNaN");
assertNoInvalidNumbers(simDurInf, "simDurInf");
assertNoInvalidNumbers(simDurNegInf, "simDurNegInf");

// ---------------------------------------------------------------------------
// 5. PROFILE IMMUTABILITY
// ---------------------------------------------------------------------------
console.log("\n▶ 5. Verifying Profile Immutability...");
const snapshot = JSON.stringify(DEMO_FINANCIAL_PROFILE);

calculateDerived(DEMO_FINANCIAL_PROFILE);
assert(JSON.stringify(DEMO_FINANCIAL_PROFILE) === snapshot, "calculateDerived preserves immutability");

applyScenario(DEMO_FINANCIAL_PROFILE, { incomeChangePercent: -50, unexpectedExpense: 100000 });
assert(JSON.stringify(DEMO_FINANCIAL_PROFILE) === snapshot, "applyScenario preserves immutability");

forecastTrend(DEMO_FINANCIAL_PROFILE, 12);
assert(JSON.stringify(DEMO_FINANCIAL_PROFILE) === snapshot, "forecastTrend preserves immutability");

runSimulation(DEMO_FINANCIAL_PROFILE, JOB_LOSS_3_MONTHS);
assert(JSON.stringify(DEMO_FINANCIAL_PROFILE) === snapshot, "runSimulation preserves immutability");

// ---------------------------------------------------------------------------
// 6. EXHAUSTIVE EDGE CASES
// ---------------------------------------------------------------------------
console.log("\n▶ 6. Verifying Exhaustive Edge Cases...");

// Edge 1: Zero Income
const edgeZeroIncome = calculateDerived({ ...DEMO_FINANCIAL_PROFILE, income: 0, otherIncome: 0 });
assert(edgeZeroIncome.savingsRate === 0, "Edge 1: Zero income -> 0% savings rate (no NaN)");
assert(edgeZeroIncome.resilienceBreakdown.debtBurden === 0, "Edge 1: Zero income with debt payment -> 0 debt burden score");
assert(edgeZeroIncome.resilienceScore >= 0 && edgeZeroIncome.resilienceScore <= 100, "Edge 1: Score bounded");
assertNoInvalidNumbers(edgeZeroIncome, "edgeZeroIncome");

// Edge 2: Zero Expenses
const edgeZeroExp = calculateDerived({
  income: 60000,
  otherIncome: 0,
  essentialExpenses: 0,
  discretionaryExpenses: 0,
  emergencyFund: 100000,
  savings: 50000,
  investments: 0,
  debt: 0,
  monthlyDebtPayment: 0,
});
assert(edgeZeroExp.totalExpenses === 0, "Edge 2: Total expenses is 0");
assert(edgeZeroExp.savingsRate === 100, "Edge 2: Savings rate is 100%");
assert(edgeZeroExp.resilienceBreakdown.expenseStability === 15, "Edge 2: Full expense stability points");
assert(edgeZeroExp.resilienceBreakdown.debtBurden === 20, "Edge 2: Full debt burden points");
assertNoInvalidNumbers(edgeZeroExp, "edgeZeroExp");

// Edge 3: Zero Emergency Fund
const edgeZeroEF = calculateDerived({ ...DEMO_FINANCIAL_PROFILE, emergencyFund: 0 });
assert(edgeZeroEF.runwayMonths === 0, "Edge 3: 0 runway months");
assert(edgeZeroEF.resilienceBreakdown.emergencyFund === 0, "Edge 3: 0 EF points");
assertNoInvalidNumbers(edgeZeroEF, "edgeZeroEF");

// Edge 4: Zero Savings & Zero Investments
const edgeZeroSavingsInv = calculateDerived({ ...DEMO_FINANCIAL_PROFILE, savings: 0, investments: 0 });
assert(edgeZeroSavingsInv.netWorth === DEMO_FINANCIAL_PROFILE.emergencyFund - DEMO_FINANCIAL_PROFILE.debt, "Edge 4: Net worth correct with 0 savings/investments");
assertNoInvalidNumbers(edgeZeroSavingsInv, "edgeZeroSavingsInv");

// Edge 5: Extremely High Debt
const edgeHighDebt = calculateDerived({
  ...DEMO_FINANCIAL_PROFILE,
  debt: 10000000,
  monthlyDebtPayment: 200000,
});
assert(edgeHighDebt.resilienceBreakdown.debtBurden === 0, "Edge 5: Extreme debt ratio gives 0 debt score");
assert(edgeHighDebt.netWorth < 0, "Edge 5: Negative net worth handled safely");
assert(edgeHighDebt.resilienceScore >= 0 && edgeHighDebt.resilienceScore <= 100, "Edge 5: Score stays bounded 0-100");
assertNoInvalidNumbers(edgeHighDebt, "edgeHighDebt");

// Edge 6: EF = 0 and Monthly Burn = 0
const edgeZeroEFBurn = calculateDerived({
  income: 50000,
  otherIncome: 0,
  essentialExpenses: 0,
  discretionaryExpenses: 10000,
  emergencyFund: 0,
  savings: 20000,
  investments: 0,
  debt: 0,
  monthlyDebtPayment: 0,
});
assert(edgeZeroEFBurn.runwayMonths === 0, "Edge 6: 0 EF and 0 Burn produces 0 runway (no NaN/Infinity)");
assertNoInvalidNumbers(edgeZeroEFBurn, "edgeZeroEFBurn");

// Edge 7: Decimals in inputs
const edgeDecimals = calculateDerived({
  income: 65432.18,
  otherIncome: 4321.09,
  essentialExpenses: 32100.45,
  discretionaryExpenses: 9876.54,
  emergencyFund: 400123.45,
  savings: 150456.78,
  investments: 100789.12,
  debt: 49999.99,
  monthlyDebtPayment: 5000.50,
});
assert(edgeDecimals.resilienceScore >= 0 && edgeDecimals.resilienceScore <= 100, "Edge 7: Score bounded with decimals");
assertNoInvalidNumbers(edgeDecimals, "edgeDecimals");

// Edge 8: 200% Expense Increase Scenario
const applied200Exp = applyScenario(DEMO_FINANCIAL_PROFILE, { rentChangePercent: 200 });
const edge200Exp = runSimulation(DEMO_FINANCIAL_PROFILE, { rentChangePercent: 200 });
assert(applied200Exp.essentialExpenses === DEMO_FINANCIAL_PROFILE.essentialExpenses * 3, "Edge 8: 200% expense increase triples essential expenses");
assert(edge200Exp.scenario.totalExpenses === applied200Exp.essentialExpenses + DEMO_FINANCIAL_PROFILE.discretionaryExpenses, "Edge 8: Total expenses reflects 200% increase");
assert(edge200Exp.delta.resilience < 0, "Edge 8: Resilience drops");
assertNoInvalidNumbers(edge200Exp, "edge200Exp");

// Edge 9: Negative Scenario Values (e.g. Rent decrease)
const edgeRentDrop = applyScenario(DEMO_FINANCIAL_PROFILE, { rentChangePercent: -20 });
assert(edgeRentDrop.essentialExpenses === DEMO_FINANCIAL_PROFILE.essentialExpenses * 0.8, "Edge 9: Rent reduction works");

// Edge 10: Discretionary Reduction Exceeding Discretionary Expenses (Clamps at 0)
const edgeDiscCut = applyScenario(DEMO_FINANCIAL_PROFILE, { discretionaryReductionAmount: 50000 });
assert(edgeDiscCut.discretionaryExpenses === 0, "Edge 10: Discretionary expenses clamped at 0");

// Edge 11: Savings Boost Exceeding Discretionary Expenses (Clamps at 0)
const edgeSaveBoost = applyScenario(DEMO_FINANCIAL_PROFILE, { savingsBoostAmount: 50000 });
assert(edgeSaveBoost.discretionaryExpenses === 0, "Edge 11: Discretionary expenses clamped at 0 on boost");

// Edge 12: Very Large Numbers
const edgeHuge = calculateDerived({
  income: 1e10,
  otherIncome: 1e9,
  essentialExpenses: 2e9,
  discretionaryExpenses: 1e9,
  emergencyFund: 5e10,
  savings: 2e10,
  investments: 1e11,
  debt: 5e8,
  monthlyDebtPayment: 1e7,
});
assert(edgeHuge.resilienceScore >= 0 && edgeHuge.resilienceScore <= 100, "Edge 12: Huge numbers stay bounded");
assertNoInvalidNumbers(edgeHuge, "edgeHuge");

// ---------------------------------------------------------------------------
// 7. PRESET SCENARIO REGISTRY VERIFICATION
// ---------------------------------------------------------------------------
console.log("\n▶ 7. Verifying Preset Scenario Registry...");
const presets = getPresetScenarios();
assert(presets.length === 5, `5 preset scenarios registered (got ${presets.length})`);

const presetIds = presets.map((p) => p.id);
assert(presetIds.includes("job_loss"), "Registry includes job_loss");
assert(presetIds.includes("rent_hike"), "Registry includes rent_hike");
assert(presetIds.includes("emergency"), "Registry includes emergency");
assert(presetIds.includes("income_increase"), "Registry includes income_increase");
assert(presetIds.includes("reduce_discretionary"), "Registry includes reduce_discretionary");

for (const p of presets) {
  const sim = runSimulation(DEMO_FINANCIAL_PROFILE, p.scenario);
  assert(sim.monthlyProjection.baseline.length === 6, `Preset ${p.id} generates 6 baseline points`);
  assert(sim.monthlyProjection.scenario.length === 6, `Preset ${p.id} generates 6 scenario points`);
  assert(sim.narrative.topFactors.length >= 1 && sim.narrative.topFactors.length <= 3, `Preset ${p.id} has 1-3 top factors`);
  assertNoInvalidNumbers(sim, `preset_${p.id}`);
}

// ---------------------------------------------------------------------------
// 8. SCENARIO SIMULATION SAMPLE OUTPUT
// ---------------------------------------------------------------------------
console.log("\n=================================================");
console.log("📊 SCENARIO SIMULATION SUMMARY");
console.log("=================================================\n");

console.log("BASELINE");
console.log(`Resilience: ${baseline.resilienceScore} (${baseline.resilienceBand})`);
console.log(`Runway: ${baseline.runwayMonths} months`);
console.log(`Monthly Savings: ${formatINR(baseline.monthlySavings)}`);
console.log(`Net Worth: ${formatINR(baseline.netWorth)}\n`);

const jobLoss = runSimulation(DEMO_FINANCIAL_PROFILE, JOB_LOSS_3_MONTHS);
console.log("JOB LOSS (3 Months)");
console.log(`Resilience: ${jobLoss.scenario.resilienceScore} (${jobLoss.scenario.resilienceBand}) [Delta: ${jobLoss.delta.resilience} pts]`);
console.log(`Runway: ${jobLoss.scenario.runwayMonths} months [Delta: ${jobLoss.delta.runway} mo]`);
console.log(`Monthly Savings: ${formatINR(jobLoss.scenario.monthlySavings)} [Delta: ${formatINR(jobLoss.delta.monthlySavings)}]`);
console.log(`Cause: ${jobLoss.narrative.cause}`);
console.log(`Top Factors: ${jobLoss.narrative.topFactors.join(", ")}\n`);

const rentHike = runSimulation(DEMO_FINANCIAL_PROFILE, RENT_INCREASE_15_PERCENT);
console.log("RENT INCREASE (+15%)");
console.log(`Resilience: ${rentHike.scenario.resilienceScore} (${rentHike.scenario.resilienceBand}) [Delta: ${rentHike.delta.resilience} pts]`);
console.log(`Runway: ${rentHike.scenario.runwayMonths} months [Delta: ${rentHike.delta.runway} mo]`);
console.log(`Monthly Savings: ${formatINR(rentHike.scenario.monthlySavings)} [Delta: ${formatINR(rentHike.delta.monthlySavings)}]`);
console.log(`Cause: ${rentHike.narrative.cause}`);
console.log(`Top Factors: ${rentHike.narrative.topFactors.join(", ")}\n`);

const emergency = runSimulation(DEMO_FINANCIAL_PROFILE, EMERGENCY_EXPENSE_50K);
console.log("EMERGENCY EXPENSE (₹50,000)");
console.log(`Resilience: ${emergency.scenario.resilienceScore} (${emergency.scenario.resilienceBand}) [Delta: ${emergency.delta.resilience} pts]`);
console.log(`Runway: ${emergency.scenario.runwayMonths} months [Delta: ${emergency.delta.runway} mo]`);
console.log(`Monthly Savings: ${formatINR(emergency.scenario.monthlySavings)} [Delta: ${formatINR(emergency.delta.monthlySavings)}]`);
console.log(`Cause: ${emergency.narrative.cause}`);
console.log(`Top Factors: ${emergency.narrative.topFactors.join(", ")}\n`);

// ---------------------------------------------------------------------------
// 9. REGRESSION TEST: Temporary Income Shock vs Permanent Expense Changes
// ---------------------------------------------------------------------------
console.log("\n=================================================");
console.log("🔍 9. REGRESSION TEST: Temporary Income Shock + Permanent Rent Hike");
console.log("=================================================\n");

const shockScenario: SimulationScenario = {
  incomeChangePercent: -100,
  durationMonths: 3,
  rentChangePercent: 15,
};

const combinedSim = runSimulation(DEMO_FINANCIAL_PROFILE, shockScenario);

const m1 = combinedSim.monthlyProjection.scenario[0];
const m2 = combinedSim.monthlyProjection.scenario[1];
const m3 = combinedSim.monthlyProjection.scenario[2];
const m4 = combinedSim.monthlyProjection.scenario[3];
const m5 = combinedSim.monthlyProjection.scenario[4];
const m6 = combinedSim.monthlyProjection.scenario[5];

const m3To4Delta = m4.netWorth - m3.netWorth;
const m4To5Delta = m5.netWorth - m4.netWorth;

const expectedPostHikeMonthlySavings = (DEMO_FINANCIAL_PROFILE.income + DEMO_FINANCIAL_PROFILE.otherIncome) - (DEMO_FINANCIAL_PROFILE.essentialExpenses * 1.15 + DEMO_FINANCIAL_PROFILE.discretionaryExpenses); // ₹18,200
const baselineMonthlySavings = (DEMO_FINANCIAL_PROFILE.income + DEMO_FINANCIAL_PROFILE.otherIncome) - (DEMO_FINANCIAL_PROFILE.essentialExpenses + DEMO_FINANCIAL_PROFILE.discretionaryExpenses); // ₹23,000

console.log(`Baseline Essential Expenses: ${formatINR(DEMO_FINANCIAL_PROFILE.essentialExpenses)}/mo`);
console.log(`Scenario Essential Expenses (+15% Rent): ${formatINR(DEMO_FINANCIAL_PROFILE.essentialExpenses * 1.15)}/mo\n`);

console.log(`Month 1-3 (Shock Active): Net Worth = ${formatINR(m1.netWorth)} -> ${formatINR(m2.netWorth)} -> ${formatINR(m3.netWorth)} (Loss: ${formatINR(m3.netWorth - m2.netWorth)}/mo)`);
console.log(`Month 4 (Post-Shock): Net Worth = ${formatINR(m4.netWorth)} (Change from M3: ${formatINR(m3To4Delta)})`);
console.log(`Month 5 (Post-Shock): Net Worth = ${formatINR(m5.netWorth)} (Change from M4: ${formatINR(m4To5Delta)})`);
console.log(`Month 6 (Post-Shock): Net Worth = ${formatINR(m6.netWorth)}\n`);

console.log(`Expected Month 4-6 Monthly Savings (with permanent rent hike): ${formatINR(expectedPostHikeMonthlySavings)}`);
console.log(`Actual Month 4-6 Monthly Savings in Projection: ${formatINR(m3To4Delta)}\n`);

const isExpenseResetBugPresent = m3To4Delta === baselineMonthlySavings;
if (isExpenseResetBugPresent) {
  console.log("❌ BUG CONFIRMED: runSimulation() incorrectly reset essentialExpenses back to baseline (₹32,000) after Month 3.");
  console.log(`   Expected post-shock monthly savings: ${formatINR(expectedPostHikeMonthlySavings)} (+15% rent retained)`);
  console.log(`   Actual post-shock monthly savings:   ${formatINR(m3To4Delta)} (rent hike was wiped out)`);
  console.log(`   Month 4 Runway: ${m4.runway} mo (computed using baseline burn instead of post-hike burn)`);
  console.log(`   Month 4 Resilience: ${m4.resilience} (computed using baseline expenses instead of post-hike expenses)\n`);
} else {
  console.log("✅ NO BUG: Rent increase remains active across all projection months.\n");
}

console.log("=================================================");
console.log(`✅ FINAL TEST SUITE: ${testsPassed} passed, ${testsFailed} failed`);
console.log("=================================================");

if (testsFailed > 0) {
  process.exit(1);
}

