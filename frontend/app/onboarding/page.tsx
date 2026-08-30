
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { GlassCard, MetricLabel, PrimaryButton } from "@/components/ui/finance";
import { parseStatementCSV } from "@/lib/ingestion/parser";
import { APEX_LOGISTICS_RAW_CSV } from "@/data/demoCompany";
import {
  Building2,
  User,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<"business" | "personal">("business");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseProgress, setParseProgress] = useState<string[]>([]);

  const handleLoadDemo = async (type: "business" | "personal") => {
    setIsProcessing(true);
    setParseProgress([]);

    const steps = [
      "Reading raw financial statement CSV stream...",
      "Executing regex merchant normalization...",
      "Categorizing debits (Fuel, Fleet EMI, Payroll, Leases)...",
      "Identifying recurring obligations and calculating liquidity baseline...",
      "Evaluating empirical exposure coefficients (β)...",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 200));
      setParseProgress((prev) => [...prev, steps[i]]);
    }

    await new Promise((r) => setTimeout(r, 250));
    router.push(`/onboarding/confirm?type=${type}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        parseStatementCSV(text);
        router.push(`/onboarding/confirm?type=${selectedPersona}`);
      } catch (err) {
        alert("Failed to parse statement: " + (err as Error).message);
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="dashboard space-y-6">
      <SiteNav />

      {/* Header */}
      <div className="dashboard-head">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <MetricLabel>FINANCIAL DIGITAL TWIN // INGESTION & CALIBRATION</MetricLabel>
          </div>
          <h1 className="text-3xl font-light text-[var(--foreground)] mt-1">
            Initialize Your Financial Digital Twin
          </h1>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            Select your operating persona and ingest statement data. FinanceGuard establishes your mathematical baseline and exposure vectors.
          </p>
        </div>
      </div>

      {/* 2 Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Hero Persona */}
        <div
          onClick={() => setSelectedPersona("business")}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
            selectedPersona === "business"
              ? "bg-[var(--panel)] border-[var(--accent)] shadow-[0_0_30px_rgba(159,207,150,0.15)]"
              : "bg-[var(--surface)] border-[var(--line)] hover:border-[var(--muted-text)]"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--accent)]">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[var(--accent)] text-[var(--background)] font-bold uppercase">
                PRIMARY HERO DEMO
              </span>
            </div>

            <div>
              <h3 className="text-xl font-serif font-medium text-[var(--foreground)]">
                Business & Enterprise Mode
              </h3>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                Apex Logistics & Freight Solutions Pvt Ltd
              </p>
            </div>

            <ul className="space-y-2 text-xs font-mono text-[var(--muted-text)] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Tier 3 = Working Capital Cushion (max(0, AP-AR) + Safety Margin)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Commodity exposure matching (Fleet Fuel β = 0.32)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Accounts Payable (₹2.9L) & Accounts Receivable (₹4.2L) tracking</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              handleLoadDemo("business");
            }}
            className="w-full py-3 rounded-lg bg-[var(--accent)] text-[var(--background)] font-mono text-xs font-bold uppercase hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Load Apex Logistics Statement Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Personal Mode */}
        <div
          onClick={() => setSelectedPersona("personal")}
          className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
            selectedPersona === "personal"
              ? "bg-[var(--panel)] border-[var(--accent)] shadow-[0_0_30px_rgba(159,207,150,0.15)]"
              : "bg-[var(--surface)] border-[var(--line)] hover:border-[var(--muted-text)]"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-sky-400">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted-text)] border border-[var(--line)] uppercase">
                SECONDARY ADAPTER
              </span>
            </div>

            <div>
              <h3 className="text-xl font-serif font-medium text-[var(--foreground)]">
                Personal Solvency Mode
              </h3>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                Ananya Sharma — Senior Operations Professional
              </p>
            </div>

            <ul className="space-y-2 text-xs font-mono text-[var(--muted-text)] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Tier 3 = Near-Term Committed Obligations Cushion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>6-Month Emergency Resilience target for living expenses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Salary cash flow and discretionary spend optimization</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              handleLoadDemo("personal");
            }}
            className="w-full py-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] text-[var(--foreground)] font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Load Personal Statement Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CSV Drag & Drop Upload Container */}
      <GlassCard className="p-8 border-dashed border-2 border-[var(--line)] text-center space-y-4">
        <UploadCloud className="w-10 h-10 text-[var(--muted-text)] mx-auto" />
        <div>
          <h4 className="text-base font-medium text-[var(--foreground)]">
            Or upload your own 3-Month Bank Statement (CSV)
          </h4>
          <p className="text-xs text-[var(--muted-text)] mt-1 font-mono">
            Supported columns: Date, Description, Type, Amount, Balance. Parsed 100% locally in your browser.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] text-xs font-mono text-[var(--foreground)] transition cursor-pointer">
          <FileText className="w-4 h-4 text-[var(--accent)]" />
          <span>SELECT STATEMENT CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
        </label>
      </GlassCard>

      {/* Ingestion Stream Progress Modal / Output */}
      {isProcessing && (
        <GlassCard className="p-6 space-y-3 border-l-4 border-l-[var(--accent)]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--accent)] animate-pulse" />
            <MetricLabel>STATEMENT INGESTION PIPELINE ACTIVE</MetricLabel>
          </div>
          <div className="space-y-1.5 font-mono text-xs text-[var(--foreground)]">
            {parseProgress.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </main>
  );
}

