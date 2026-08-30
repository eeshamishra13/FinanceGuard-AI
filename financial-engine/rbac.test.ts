import {
  getCurrentSession,
  setActiveSessionEmail,
  canEdit,
  canManageOrg,
  canView,
  isSessionValid,
  PRESEEDED_MEMBERS,
} from "../frontend/lib/authSession.ts";
import {
  createBusinessTwin,
  calculateWaterfall,
  generateFinancialAlerts,
  optimizeLiquidityDecisions,
} from "./index.ts";
import { validateOrganizationSettings } from "./twinTypes.ts";
import { GET as getTwin } from "../frontend/app/api/v1/twin/[id]/route.ts";
import { GET as getWaterfall } from "../frontend/app/api/v1/twin/[id]/waterfall/route.ts";
import { GET as getExposures } from "../frontend/app/api/v1/twin/[id]/exposures/route.ts";
import { GET as getMonteCarlo } from "../frontend/app/api/v1/twin/[id]/montecarlo/route.ts";
import { GET as getDecisions } from "../frontend/app/api/v1/twin/[id]/decisions/route.ts";
import { GET as getReport } from "../frontend/app/api/report/route.tsx";
import { POST as postCopilot } from "../frontend/app/api/copilot/route.ts";
import { POST as postSignals } from "../frontend/app/api/signals/route.ts";

console.log("=================================================");
console.log("🧪 FINANCEGUARD ENTERPRISE & ADVERSARIAL RBAC SUITE");
console.log("=================================================");

let passed = 0;
let failed = 0;

async function it(desc: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    failed++;
  }
}

async function runTests() {
  // -------------------------------------------------------------
  // Test Group 1: Role-based permissions & identity switching
  // -------------------------------------------------------------
  console.log("\n▶ 1. Verifying Session Identity & RBAC permissions...");

  await it("Admin session has full manage/edit/view permissions", () => {
    const session = PRESEEDED_MEMBERS["admin@apexlogistics.com"];
    if (!canManageOrg(session) || !canEdit(session) || !canView(session)) {
      throw new Error("Admin missing manage/edit/view permission");
    }
  });

  await it("Editor session has edit/view permission but cannot manage organization", () => {
    const session = PRESEEDED_MEMBERS["editor@apexlogistics.com"];
    if (canManageOrg(session) || !canEdit(session) || !canView(session)) {
      throw new Error("Editor permissions incorrect");
    }
  });

  await it("Viewer session is read-only, cannot edit or manage organization", () => {
    const session = PRESEEDED_MEMBERS["viewer@apexlogistics.com"];
    if (canManageOrg(session) || canEdit(session) || !canView(session)) {
      throw new Error("Viewer permissions incorrect");
    }
  });

  // -------------------------------------------------------------
  // Test Group 2: Mutating routes server-side 403 enforcement
  // -------------------------------------------------------------
  console.log("\n▶ 2. Verifying server-side route gating (403 for Viewer)...");

  await it("Viewer session hitting POST /api/copilot directly returns 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/copilot", {
      method: "POST",
      headers: {
        "x-user-role": "viewer",
        "x-user-email": "viewer@apexlogistics.com",
      },
      body: JSON.stringify({ query: "Hello" }),
    });
    const res = await postCopilot(req);
    if (res.status !== 403) {
      throw new Error(`Viewer expected 403 on /api/copilot, got ${res.status}`);
    }
  });

  await it("Viewer session hitting POST /api/signals directly returns 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/signals", {
      method: "POST",
      headers: {
        "x-user-role": "viewer",
        "x-user-email": "viewer@apexlogistics.com",
      },
    });
    const res = await postSignals(req);
    if (res.status !== 403) {
      throw new Error(`Viewer expected 403 on /api/signals, got ${res.status}`);
    }
  });

  await it("Viewer session hitting GET /api/report directly returns 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/report", {
      method: "GET",
      headers: {
        "x-user-role": "viewer",
        "x-user-email": "viewer@apexlogistics.com",
      },
    });
    const res = await getReport(req);
    if (res.status !== 403) {
      throw new Error(`Viewer expected 403 on /api/report, got ${res.status}`);
    }
  });

  await it("Admin session hitting POST /api/copilot returns 200 OK", async () => {
    const req = new Request("http://localhost:3000/api/copilot", {
      method: "POST",
      headers: {
        "x-user-role": "admin",
        "x-user-email": "admin@apexlogistics.com",
      },
      body: JSON.stringify({ query: "Explain runway" }),
    });
    const res = await postCopilot(req);
    if (res.status !== 200) {
      throw new Error(`Admin expected 200, got ${res.status}`);
    }
  });

  // -------------------------------------------------------------
  // Test Group 3: REST API v1 key-auth checks across ALL 5 endpoints
  // -------------------------------------------------------------
  console.log("\n▶ 3. Verifying REST API v1 key authentication across ALL 5 endpoints...");

  process.env.FINANCEGUARD_DEMO_API_KEY = "test_key_enterprise_99";
  const params = { params: { id: "twin_apex_logistics" } };

  const endpoints = [
    { name: "GET /api/v1/twin/[id]", handler: (req: Request) => getTwin(req, params) },
    { name: "GET /api/v1/twin/[id]/waterfall", handler: (req: Request) => getWaterfall(req) },
    { name: "GET /api/v1/twin/[id]/exposures", handler: (req: Request) => getExposures(req) },
    { name: "GET /api/v1/twin/[id]/montecarlo", handler: (req: Request) => getMonteCarlo(req) },
    { name: "GET /api/v1/twin/[id]/decisions", handler: (req: Request) => getDecisions(req) },
  ];

  for (const ep of endpoints) {
    await it(`${ep.name} with valid x-api-key returns 200 OK`, async () => {
      const req = new Request("http://localhost:3000/api/v1/twin/twin_apex_logistics", {
        headers: { "x-api-key": "test_key_enterprise_99" },
      });
      const res = await ep.handler(req);
      if (res.status !== 200) {
        throw new Error(`Expected 200 on ${ep.name}, got ${res.status}`);
      }
    });

    await it(`${ep.name} with missing x-api-key returns 401 Unauthorized`, async () => {
      const req = new Request("http://localhost:3000/api/v1/twin/twin_apex_logistics");
      const res = await ep.handler(req);
      if (res.status !== 401) {
        throw new Error(`Expected 401 on missing key for ${ep.name}, got ${res.status}`);
      }
    });

    await it(`${ep.name} with invalid x-api-key returns 401 Unauthorized`, async () => {
      const req = new Request("http://localhost:3000/api/v1/twin/twin_apex_logistics", {
        headers: { "x-api-key": "wrong_adversarial_key" },
      });
      const res = await ep.handler(req);
      if (res.status !== 401) {
        throw new Error(`Expected 401 on invalid key for ${ep.name}, got ${res.status}`);
      }
    });
  }

  // -------------------------------------------------------------
  // Test Group 4: Malformed OrganizationSettings Rejection
  // -------------------------------------------------------------
  console.log("\n▶ 4. Verifying Malformed OrganizationSettings Rejection...");

  await it("Negative emergencyBufferMonths is rejected with clear Error", () => {
    let threw = false;
    try {
      validateOrganizationSettings({ emergencyBufferMonths: -3 });
    } catch (e: any) {
      threw = true;
      if (!e.message.includes("non-negative")) {
        throw new Error(`Wrong error message: ${e.message}`);
      }
    }
    if (!threw) throw new Error("Expected negative emergencyBufferMonths to throw");
  });

  await it("NaN emergencyBufferMonths in calculateWaterfall is rejected", () => {
    const twin = createBusinessTwin({
      companyName: "Apex Logistics",
      industry: "Logistics",
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
      exposureCategories: ["Fuel"],
    });

    let threw = false;
    try {
      calculateWaterfall(twin, { emergencyBufferMonths: NaN });
    } catch (e: any) {
      threw = true;
    }
    if (!threw) throw new Error("Expected NaN emergencyBufferMonths to throw");
  });

  await it("Empty activeCategories in generateFinancialAlerts is rejected", () => {
    const twin = createBusinessTwin({
      companyName: "Apex Logistics",
      industry: "Logistics",
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
      exposureCategories: ["Fuel"],
    });

    let threw = false;
    try {
      generateFinancialAlerts(twin, [], { emergencyBufferMonths: 3, activeCategories: [] });
    } catch (e: any) {
      threw = true;
      if (!e.message.includes("cannot be empty")) {
        throw new Error(`Wrong error message: ${e.message}`);
      }
    }
    if (!threw) throw new Error("Expected empty activeCategories to throw");
  });

  await it("Invalid customBetaOverrides (> 5.0 or negative) is rejected", () => {
    let threw = false;
    try {
      validateOrganizationSettings({
        emergencyBufferMonths: 3,
        activeCategories: ["Fuel"],
        customBetaOverrides: { Fuel: 99.0 },
      });
    } catch (e: any) {
      threw = true;
      if (!e.message.includes("customBetaOverrides")) {
        throw new Error(`Wrong error message: ${e.message}`);
      }
    }
    if (!threw) throw new Error("Expected custom beta > 5.0 to throw");
  });

  // -------------------------------------------------------------
  // Test Group 5: Session Tampering, Revocation & Expiry
  // -------------------------------------------------------------
  console.log("\n▶ 5. Verifying Session Revocation & Expiry Handling...");

  await it("Revoked Editor session is denied edit access", () => {
    const revokedEditor = {
      ...PRESEEDED_MEMBERS["editor@apexlogistics.com"],
      isRevoked: true,
    };
    if (canEdit(revokedEditor) || canView(revokedEditor)) {
      throw new Error("Revoked editor should not have edit or view access");
    }
  });

  await it("Expired Admin session is denied manage/edit access", () => {
    const expiredAdmin = {
      ...PRESEEDED_MEMBERS["admin@apexlogistics.com"],
      expiresAt: "2020-01-01T00:00:00.000Z", // Past date
    };
    if (canManageOrg(expiredAdmin) || canEdit(expiredAdmin)) {
      throw new Error("Expired admin should not retain manage or edit access");
    }
  });

  // -------------------------------------------------------------
  // Test Group 6: Backward Compatibility (Legacy Single-User Twin)
  // -------------------------------------------------------------
  console.log("\n▶ 6. Verifying Backward Compatibility with Legacy Twins...");

  await it("Legacy single-user twin without OrganizationSettings functions seamlessly", () => {
    const legacyTwin = createBusinessTwin({
      companyName: "Legacy Sole Proprietorship",
      industry: "Retail",
      monthlyRevenue: 200000,
      fixedOpEx: 100000,
      variableOpEx: 20000,
      payroll: 40000,
      fuelSpend: 15000,
      debtService: 10000,
      totalDebt: 100000,
      cashBalance: 400000,
      accountsReceivable: 50000,
      accountsPayable: 30000,
      exposureCategories: ["Fuel"],
    });

    const wf = calculateWaterfall(legacyTwin);
    if (!wf || !wf.summary || wf.summary.effectiveRunwayMonths <= 0) {
      throw new Error("Legacy waterfall calculation failed");
    }

    const alerts = generateFinancialAlerts(legacyTwin, []);
    if (!Array.isArray(alerts)) {
      throw new Error("Legacy alerts generation failed");
    }

    const opt = optimizeLiquidityDecisions(legacyTwin);
    if (!opt || !opt.primaryAction) {
      throw new Error("Legacy LP optimization failed");
    }
  });

  // -------------------------------------------------------------
  // Final Verdict
  // -------------------------------------------------------------
  console.log("\n=================================================");
  console.log(`✅ FINAL ENTERPRISE & ADVERSARIAL SUITE: ${passed} passed, ${failed} failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
