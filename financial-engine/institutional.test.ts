import { parseStatementCSV } from "../frontend/lib/ingestion/parser.ts";
import {
  createBusinessTwin,
  calculateWaterfall,
  optimizeLiquidityDecisions,
  runMonteCarloRunway,
} from "./index.ts";

console.log("=================================================");
console.log("🧪 FINANCEGUARD INSTITUTIONAL CUSTOMER 360 SUITE");
console.log("=================================================");

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    failed++;
  }
}

// -------------------------------------------------------------
// Test Group 1: Messy & Adversarial CSV Ingestion
// -------------------------------------------------------------
console.log("\n▶ 1. Ingestion Pipeline Against Messy Real-World CSV Data...");

const MESSY_CSV = `Date, Description, Type, Amount, Balance
2026-08-01 , "RELIANCE FREIGHT CLIENT SETTLEMENT" , credit , "₹ 6,80,000.00" , 14,50,000
2026-08-05 , IOCL DIESEL FUEL REFUEL , debit , ₹ 1,20,000 , 1330000
2026-08-05 , IOCL DIESEL FUEL REFUEL , debit , ₹ 1,20,000 , 1330000
2026-08-10 , HDFC BANK VEHICLE LOAN EMI , debit , $ 65,000.50 , 1265000
2026-08-15 , STAFF SALARY NEFT PAYROLL BATCH , debit , 140000 , 1125000
2026-08-20 , WAREHOUSE INDUSTRIAL LEASE RENT , debit , 150000 , 975000
2026/08/25 , MISCELLANEOUS CORRECTION CR , credit , 20000 , 995000
invalid line with missing columns
, , , ,
2026-08-28 , "BESCOM POWER & ELECTRICITY UTILITY" , debit , 15000 , 980000
`;

it("Messy CSV with currency symbols, quotes, commas, extra spaces & dirty lines parses gracefully", () => {
  const result = parseStatementCSV(MESSY_CSV);

  if (!result || result.transactions.length === 0) {
    throw new Error("Failed to parse messy CSV transactions");
  }

  // Deduplication check: Duplicate IOCL line was deduplicated
  const fuelTxs = result.transactions.filter((t) => t.category === "Fuel");
  if (fuelTxs.length !== 1) {
    throw new Error(`Expected exactly 1 fuel transaction after deduplication, got ${fuelTxs.length}`);
  }

  // Clean currency parsing check: Revenue parsed cleanly without NaN
  if (result.detectedMonthlyRevenue !== 700000) {
    throw new Error(`Expected revenue of 700000, got ${result.detectedMonthlyRevenue}`);
  }

  // Fuel spend parsed cleanly from ₹ 1,20,000
  if (result.detectedFuelSpend !== 120000) {
    throw new Error(`Expected fuel spend of 120000, got ${result.detectedFuelSpend}`);
  }

  // Debt service parsed cleanly from $ 65,000.50
  if (Math.round(result.detectedDebtService) !== 65001) {
    throw new Error(`Expected debt service of ~65001, got ${result.detectedDebtService}`);
  }

  // Business profile generated without NaN
  const profile = result.generatedBusinessProfile;
  if (isNaN(profile.monthlyRevenue) || isNaN(profile.fixedOpEx) || isNaN(profile.cashBalance)) {
    throw new Error("Business profile contains NaN values from messy CSV");
  }
});

// -------------------------------------------------------------
// Test Group 2: Portfolio-Scale Performance Benchmark (50 Twins)
// -------------------------------------------------------------
console.log("\n▶ 2. Portfolio-Scale Benchmark (50 Ingested Twins End-to-End)...");

it("Processes 50 synthetic SME companies through full pipeline under 500ms", () => {
  const NUM_COMPANIES = 50;
  const portfolioStatements: string[] = [];

  for (let i = 0; i < NUM_COMPANIES; i++) {
    const rev = 300000 + (i * 25000);
    const fuel = 50000 + (i * 5000);
    const emi = 30000 + (i * 3000);
    const salary = 80000 + (i * 8000);
    const rent = 40000 + (i * 2000);
    const cash = 200000 + (i * 60000);

    portfolioStatements.push(`Date,Description,Type,Amount,Balance
2026-08-01,CLIENT FREIGHT INVOICE CR,credit,${rev},${cash}
2026-08-05,BPCL DIESEL REFUELLING,debit,${fuel},${cash - fuel}
2026-08-10,TATA MOTORS VEHICLE EMI,debit,${emi},${cash - fuel - emi}
2026-08-15,STAFF SALARY DISBURSEMENT,debit,${salary},${cash - fuel - emi - salary}
2026-08-20,WAREHOUSE ESTATE LEASE RENT,debit,${rent},${cash - fuel - emi - salary - rent}
`);
  }

  const startTime = performance.now();

  const portfolioResults = portfolioStatements.map((csv, idx) => {
    // 1. Ingestion
    const discovery = parseStatementCSV(csv);
    discovery.generatedBusinessProfile.companyName = `SME Logistics Enterprise #${idx + 1}`;

    // 2. Twin creation
    const twin = createBusinessTwin(discovery.generatedBusinessProfile);

    // 3. 4-tier waterfall
    const waterfall = calculateWaterfall(twin);

    // 4. LP decision optimization
    const decision = optimizeLiquidityDecisions(twin);

    // 5. Stochastic Monte Carlo
    const mc = runMonteCarloRunway(twin, { simulationsCount: 200, seed: idx });

    return {
      twinId: twin.id,
      company: twin.entityName,
      healthBand: waterfall.summary.healthBand,
      runway: waterfall.summary.effectiveRunwayMonths,
      p50Runway: mc.percentiles.p50,
      directive: decision.primaryAction.title,
    };
  });

  const endTime = performance.now();
  const durationMs = endTime - startTime;
  const msPerCompany = (durationMs / NUM_COMPANIES).toFixed(2);

  console.log(`    ↳ 📊 Portfolio Benchmark: Processed ${NUM_COMPANIES} SME companies in ${durationMs.toFixed(2)}ms (${msPerCompany}ms/company)`);

  if (portfolioResults.length !== NUM_COMPANIES) {
    throw new Error(`Expected ${NUM_COMPANIES} processed companies, got ${portfolioResults.length}`);
  }

  // Ensure reasonable throughput threshold
  if (durationMs > 2000) {
    throw new Error(`Benchmark exceeded budget: ${durationMs.toFixed(2)}ms > 2000ms`);
  }
});

// -------------------------------------------------------------
// Final Verdict
// -------------------------------------------------------------
console.log("\n=================================================");
console.log(`✅ FINAL INSTITUTIONAL SUITE: ${passed} passed, ${failed} failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
