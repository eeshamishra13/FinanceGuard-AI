import {
  createBusinessTwin,
  createPersonalTwin,
} from "./adapters.ts";
import {
  calculateSingleExposureImpact,
  calculateTwinExposureImpacts,
  estimateBetaWithShrinkage,
} from "./exposure.ts";
import {
  calculateWaterfall,
} from "./waterfall.ts";
import {
  runMonteCarloRunway,
} from "./monteCarlo.ts";
import {
  generateSensitivityTornado,
} from "./sensitivity.ts";
import {
  optimizeLiquidityDecisions,
} from "./optimizer.ts";
import {
  DEMO_FINANCIAL_PROFILE,
} from "./demoData.ts";
import type { BusinessProfile } from "./twinTypes.ts";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  } else {
    passed++;
  }
}

console.log("=================================================");
console.log("🧪 FINANCEGUARD UNIVERSAL TWIN & QUANT SUITE");
console.log("=================================================\n");

// -------------------------------------------------------------
// 1. BUSINESS & PERSONAL ADAPTERS
// -------------------------------------------------------------
console.log("▶ 1. Verifying Business & Personal Adapters...");

const sampleBiz: BusinessProfile = {
  companyName: "Apex Logistics",
  industry: "Freight Logistics & Transport",
  monthlyRevenue: 680000,
  fixedOpEx: 350000,
  variableOpEx: 60000,
  payroll: 140000,
  fuelSpend: 120000,
  debtService: 65000,
  totalDebt: 850000,
  cashBalance: 1450000,
  accountsReceivable: 420000,
  accountsPayable: 290000,
  exposureCategories: ["Fuel", "Debt Service"],
};

const bizTwin = createBusinessTwin(sampleBiz);
assert(bizTwin.twinType === "business", "TwinType is business");
assert(bizTwin.entityName === "Apex Logistics", "Entity name is Apex Logistics");
assert(bizTwin.monthlyInflow === 680000, "Inflow matches revenue");
assert(bizTwin.mandatoryExpenses === 350000 + 65000, "Mandatory OpEx includes Fixed + Debt Service");
assert(bizTwin.totalMonthlyBurn === 350000 + 60000 + 65000, "Total burn includes Fixed + Variable + Debt");
assert(bizTwin.netMonthlyCashflow === 680000 - 475000, "Net cashflow is ₹2,05,000");
assert(bizTwin.totalLiquidCash === 1450000, "Total liquid cash is ₹14.5L");
assert(bizTwin.accountsReceivable === 420000, "AR preserved");
assert(bizTwin.accountsPayable === 290000, "AP preserved");
assert(bizTwin.exposures.length >= 3, "Default exposures assigned");

const persTwin = createPersonalTwin(DEMO_FINANCIAL_PROFILE);
assert(persTwin.twinType === "personal", "Personal TwinType is personal");
assert(persTwin.monthlyInflow === 65000, "Personal inflow ₹65,000");
assert(persTwin.mandatoryExpenses === 32000 + 5000, "Personal mandatory includes essential + EMI");
assert(persTwin.totalLiquidCash === 400000 + 150000, "Personal liquid cash aggregates EF + Savings");
assert(persTwin.accountsReceivable === 0 && persTwin.accountsPayable === 0, "Personal AR/AP is 0");

// -------------------------------------------------------------
// 2. FOUR-TIER LIQUIDITY WATERFALL
// -------------------------------------------------------------
console.log("\n▶ 2. Verifying 4-Tier Liquidity Waterfall...");

const bizWaterfall = calculateWaterfall(bizTwin);
assert(bizWaterfall.tier1_operational.isFullyFunded, "Biz Tier 1 fully funded");
assert(bizWaterfall.tier2_emergencyBuffer.targetMonths === 3, "Biz Tier 2 default target is 3 months");
assert(bizWaterfall.tier3_workingCapitalOrObligations.name === "Working Capital Cushion", "Biz Tier 3 labeled Working Capital");
assert(bizWaterfall.tier4_deployableSurplus.amount >= 0, "Biz Tier 4 is non-negative");
assert(
  bizWaterfall.summary.totalLiquidCash ===
  bizWaterfall.tier1_operational.amountAllocated +
  bizWaterfall.tier2_emergencyBuffer.amountAllocated +
  bizWaterfall.tier3_workingCapitalOrObligations.amountAllocated +
  bizWaterfall.tier4_deployableSurplus.amount,
  "Waterfall allocation strictly conserves total liquid cash"
);

const persWaterfall = calculateWaterfall(persTwin);
assert(persWaterfall.tier3_workingCapitalOrObligations.name === "Near-Term Obligations Cushion", "Personal Tier 3 labeled Near-Term Obligations");
assert(persWaterfall.tier2_emergencyBuffer.targetMonths === 6, "Personal Tier 2 default target is 6 months");

// Edge case: Severely depleted cash
const depletedTwin = { ...bizTwin, totalLiquidCash: 200000 };
const depletedWaterfall = calculateWaterfall(depletedTwin);
assert(!depletedWaterfall.tier1_operational.isFullyFunded, "Depleted cash fails Tier 1");
assert(depletedWaterfall.tier4_deployableSurplus.amount === 0, "Depleted cash Tier 4 is 0");
assert(depletedWaterfall.summary.healthBand === "critical", "Health band is critical");

// Edge case: Zero total liquid cash
const zeroCashWaterfall = calculateWaterfall({ ...bizTwin, totalLiquidCash: 0 });
assert(zeroCashWaterfall.tier1_operational.amountAllocated === 0, "Zero cash allocates 0 to Tier 1");
assert(zeroCashWaterfall.tier4_deployableSurplus.amount === 0, "Zero cash Tier 4 is strictly 0");
assert(zeroCashWaterfall.summary.effectiveRunwayMonths === 0, "Zero cash runway is 0 months");

// Edge case: AR > AP (Negative working capital gap clamped at zero)
const arDominantTwin = { ...bizTwin, accountsReceivable: 1000000, accountsPayable: 200000 };
const arDominantWaterfall = calculateWaterfall(arDominantTwin);
assert(
  arDominantWaterfall.tier3_workingCapitalOrObligations.amountRequired === Math.round(arDominantTwin.mandatoryExpenses * 0.5),
  "When AR > AP, net working capital gap clamps at 0 plus operating safety margin"
);

// -------------------------------------------------------------
// 3. EXPOSURE ENGINE & SHRINKAGE
// -------------------------------------------------------------
console.log("\n▶ 3. Verifying Exposure Engine & Shrinkage Estimator...");

// Low sample data -> prior
const lowEst = estimateBetaWithShrinkage(1, 0.45, "Fuel");
assert(lowEst.method === "prior" && lowEst.confidence === "low" && lowEst.beta === 0.32, "Low sample returns prior beta");

// Medium sample data -> shrinkage blend
const medEst = estimateBetaWithShrinkage(6, 0.50, "Fuel");
assert(medEst.method === "shrinkage" && medEst.confidence === "medium", "Medium sample returns shrinkage blend");

// High sample data -> regression
const highEst = estimateBetaWithShrinkage(15, 0.42, "Fuel");
assert(highEst.method === "regression" && highEst.confidence === "high" && highEst.beta === 0.42, "High sample returns regression beta");

// Single exposure shock (+25% Diesel)
const fuelExp = bizTwin.exposures.find((e) => e.category === "Fuel")!;
const dieselImpact = calculateSingleExposureImpact(fuelExp, 92, 115, "Diesel Fuel");
assert(dieselImpact.percentageChange === 25, "+25% percentage change calculated");
// ΔCost = 0.32 * 0.25 * 120,000 = ₹9,600
assert(dieselImpact.deltaMonthlyCost === 9600, `Diesel +25% increases monthly fuel cost by ₹9,600 (got ${dieselImpact.deltaMonthlyCost})`);

// Extreme shock test: +200% Fuel shock
const extremeFuelImpact = calculateSingleExposureImpact(fuelExp, 92, 276, "Diesel Fuel");
assert(extremeFuelImpact.percentageChange === 200, "+200% extreme shock handled safely");
assert(extremeFuelImpact.deltaMonthlyCost === 0.32 * 2.0 * 120000, "Extreme fuel delta is exactly ₹76,800");

// Aggregate shock
const aggregateImpact = calculateTwinExposureImpacts(bizTwin, {
  diesel: { original: 92, shocked: 115, name: "Diesel" },
  interest_rate: { original: 6.5, shocked: 7.5, name: "RBI Repo Rate" },
});
assert(aggregateImpact.impacts.length >= 2, "Evaluates all matched shocks");
assert(aggregateImpact.totalDeltaMonthlyOpEx > 0, "Aggregate OpEx increased");
assert(aggregateImpact.revisedTotalMonthlyBurn === bizTwin.totalMonthlyBurn + aggregateImpact.totalDeltaMonthlyOpEx, "Revised burn is strictly additive");

// -------------------------------------------------------------
// 4. MONTE CARLO PROBABILISTIC SIMULATOR
// -------------------------------------------------------------
console.log("\n▶ 4. Verifying Monte Carlo Runway Simulator...");

const mc1 = runMonteCarloRunway(bizTwin, { seed: 101, simulationsCount: 1000 });
const mc2 = runMonteCarloRunway(bizTwin, { seed: 101, simulationsCount: 1000 });

assert(mc1.simulationsCount === 1000, "Exactly 1,000 simulations executed");
assert(mc1.percentiles.p10 <= mc1.percentiles.p50, "P10 <= P50");
assert(mc1.percentiles.p50 <= mc1.percentiles.p90, "P50 <= P90");
assert(mc1.percentiles.p10 === mc2.percentiles.p10, "Seeded runs are 100% reproducible");
assert(mc1.percentiles.p50 === mc2.percentiles.p50, "P50 matches across identical seeds");
assert(mc1.probabilityOfSurvival12Months >= 0 && mc1.probabilityOfSurvival12Months <= 100, "Survival prob in [0, 100]");
assert(mc1.distribution.length >= 4, "Histogram bins generated");

// Zero-volatility deterministic test
const mcZeroVol = runMonteCarloRunway(bizTwin, {
  simulationsCount: 1000,
  seed: 42,
  revenueStdDev: 0,
  expenseStdDev: 0,
});
assert(mcZeroVol.percentiles.p10 === mcZeroVol.percentiles.p90, "Zero volatility produces identical P10 and P90");

// -------------------------------------------------------------
// 5. SENSITIVITY TORNADO ANALYSIS
// -------------------------------------------------------------
console.log("\n▶ 5. Verifying Sensitivity Tornado Analysis...");

const tornado = generateSensitivityTornado(bizTwin);
assert(tornado.length >= 4, "Tornado covers all primary vectors");
assert(tornado[0].vulnerabilityRank === 1, "Rank 1 is assigned to top vulnerability");
assert(tornado[0].swingMonths >= tornado[1].swingMonths, "Tornado is strictly sorted descending by swing magnitude");

// -------------------------------------------------------------
// 6. CONSTRAINED DECISION OPTIMIZER
// -------------------------------------------------------------
console.log("\n▶ 6. Verifying Constrained Decision Optimizer...");

const optimization = optimizeLiquidityDecisions(bizTwin);
assert(optimization.constraintsSatisfied, "Constraints satisfied");
assert(optimization.recommendedActions.length > 0, "Generates actionable recommendations");
assert(optimization.primaryAction !== undefined, "Identifies primary action");
assert(optimization.primaryAction.amount >= 0, "Recommended amount is non-negative");
assert(optimization.primaryAction.constraintsChecked.noNegativeSurplus, "No negative surplus constraint respected");

console.log("\n=================================================");
console.log(`✅ FINAL QUANT TEST SUITE: ${passed} passed, ${failed} failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
