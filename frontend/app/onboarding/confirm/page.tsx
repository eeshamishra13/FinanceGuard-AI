"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { GlassCard, MetricLabel, PrimaryButton } from "@/components/ui/finance";
import { formatINR, createBusinessTwin, createPersonalTwin, DEMO_FINANCIAL_PROFILE } from "@/financial-engine";
import { setActiveTwin } from "@/lib/twinStore";
import {
  CheckCircle2,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Sliders,
  DollarSign,
  Fuel,
  Percent,
} from "lucide-react";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("type") || "business";

  const [companyName, setCompanyName] = useState(
    mode === "business" ? "Apex Logistics & Freight Solutions Pvt Ltd" : "Ananya Sharma"
  );
  const [revenue, setRevenue] = useState(mode === "business" ? 680000 : 65000);
  const [fixedOpEx, setFixedOpEx] = useState(mode === "business" ? 350000 : 32000);
  const [fuelSpend, setFuelSpend] = useState(mode === "business" ? 120000 : 4500);
  const [debtService, setDebtService] = useState(mode === "business" ? 65000 : 5000);
  const [cashBalance, setCashBalance] = useState(mode === "business" ? 1450000 : 550000);
  const [receivables, setReceivables] = useState(mode === "business" ? 420000 : 0);
  const [payables, setPayables] = useState(mode === "business" ? 290000 : 0);
  const [fuelBeta, setFuelBeta] = useState(mode === "business" ? 0.32 : 0.18);

  const [isEditing, setIsEditing] = useState(false);

  const handleConfirmAndLaunch = () => {
    if (mode === "business") {
      const twin = createBusinessTwin({
        companyName,
        industry: "Freight Logistics & Multimodal Transport",
        monthlyRevenue: revenue,
        fixedOpEx,
        variableOpEx: 60000,
        payroll: 140000,
        fuelSpend,
        debtService,
        totalDebt: 850000,
        cashBalance,
        accountsReceivable: receivables,
        accountsPayable: payables,
        exposureCategories: ["Fuel", "Debt Service"],
      });
      // Set custom beta
      const fuelExp = twin.exposures.find((e) => e.category === "Fuel");
      if (fuelExp) fuelExp.beta = fuelBeta;

      setActiveTwin(twin);
    } else {
      const twin = createPersonalTwin({
        ...DEMO_FINANCIAL_PROFILE,
        income: revenue,
        essentialExpenses: fixedOpEx,
        monthlyDebtPayment: debtService,
        emergencyFund: Math.round(cashBalance * 0.7),
        savings: Math.round(cashBalance * 0.3),
      });
      setActiveTwin(twin);
    }

    router.push("/");
  };

  return (
    <main className="dashboard space-y-6">
      <SiteNav />

      {/* Header */}
      <div className="dashboard-head">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <MetricLabel>STATEMENT EXTRACTION // TRUST & CALIBRATION MILESTONE</MetricLabel>
          </div>
          <h1 className="text-3xl font-light text-[var(--foreground)] mt-1">
            We Found These Financial Patterns
          </h1>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            Review the extracted metrics and empirical exposure estimates. You can edit any value before initializing your Financial Digital Twin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-mono text-[var(--foreground)] hover:border-[var(--accent)] transition cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? "LOCK VALUES" : "MANUAL OVERRIDE"}</span>
        </button>
      </div>

      {/* Discovered Numbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 space-y-2">
          <MetricLabel>MONTHLY INFLOW / REVENUE</MetricLabel>
          {isEditing ? (
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--line)] font-mono text-lg text-[var(--foreground)] outline-none"
            />
          ) : (
            <strong className="text-2xl font-mono text-[var(--foreground)] block">
              {formatINR(revenue)}
            </strong>
          )}
          <span className="text-[10px] text-[var(--muted-text)] font-mono">
            Detected from 3 credit settlement transactions
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2">
          <MetricLabel>MANDATORY OPEX (FIXED)</MetricLabel>
          {isEditing ? (
            <input
              type="number"
              value={fixedOpEx}
              onChange={(e) => setFixedOpEx(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--line)] font-mono text-lg text-[var(--foreground)] outline-none"
            />
          ) : (
            <strong className="text-2xl font-mono text-[var(--critical)] block">
              {formatINR(fixedOpEx)}
            </strong>
          )}
          <span className="text-[10px] text-[var(--muted-text)] font-mono">
            Warehouse lease + Payroll batch debits
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2">
          <MetricLabel>FLEET FUEL & ENERGY SPEND</MetricLabel>
          {isEditing ? (
            <input
              type="number"
              value={fuelSpend}
              onChange={(e) => setFuelSpend(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--line)] font-mono text-lg text-[var(--foreground)] outline-none"
            />
          ) : (
            <strong className="text-2xl font-mono text-amber-400 block">
              {formatINR(fuelSpend)}
            </strong>
          )}
          <span className="text-[10px] text-[var(--muted-text)] font-mono">
            IOCL, HPCL, BPCL recurring fuel debits
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2">
          <MetricLabel>MONTHLY DEBT SERVICE (EMI)</MetricLabel>
          {isEditing ? (
            <input
              type="number"
              value={debtService}
              onChange={(e) => setDebtService(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--line)] font-mono text-lg text-[var(--foreground)] outline-none"
            />
          ) : (
            <strong className="text-2xl font-mono text-[var(--foreground)] block">
              {formatINR(debtService)}
            </strong>
          )}
          <span className="text-[10px] text-[var(--muted-text)] font-mono">
            Tata Motors commercial vehicle EMI
          </span>
        </GlassCard>
      </div>

      {/* Discovered Exposure Coefficients */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <MetricLabel>EMPIRICAL EXPOSURE ESTIMATE</MetricLabel>
            <h3 className="text-lg font-serif font-medium text-[var(--foreground)] mt-0.5">
              Identified Macroeconomic Exposure Coefficients (β)
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--muted-text)]">
            Method: <b>Shrinkage (Medium Confidence)</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--panel)] text-amber-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <b className="text-sm text-[var(--foreground)] block">Fuel & Diesel Price Sensitivity</b>
                <span className="text-[10px] text-[var(--muted-text)]">Fleet fuel expenditure line</span>
              </div>
            </div>

            <div className="text-right">
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={fuelBeta}
                  onChange={(e) => setFuelBeta(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded bg-[var(--panel)] border border-[var(--line)] font-mono text-base text-amber-400 font-bold text-right"
                />
              ) : (
                <strong className="text-xl text-amber-400 block font-bold">β = {fuelBeta.toFixed(2)}</strong>
              )}
              <span className="text-[9px] text-[var(--muted-text)]">Medium Shrinkage Blend</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[var(--panel)] text-sky-400">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <b className="text-sm text-[var(--foreground)] block">Interest Rate Sensitivity</b>
                <span className="text-[10px] text-[var(--muted-text)]">Vehicle financing loans</span>
              </div>
            </div>

            <div className="text-right">
              <strong className="text-xl text-sky-400 block font-bold">β = 0.35</strong>
              <span className="text-[9px] text-[var(--muted-text)]">Category Prior</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Confirmation CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleConfirmAndLaunch}
          className="px-8 py-4 rounded-xl bg-[var(--accent)] text-[var(--background)] font-mono text-sm font-bold uppercase hover:opacity-90 transition flex items-center gap-2 cursor-pointer shadow-xl"
        >
          <span>Confirm & Launch Command Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="dashboard text-center py-20 font-mono text-xs">Loading discovered telemetry...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
