"use client";

import React from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SiteNav } from "@/components/site-nav";
import { AnimatedNumber, GlassCard, MetricLabel, PrimaryButton, ResilienceRing, RunwayGauge, SectionHeading } from "@/components/ui/finance";
import {
  calculateDerived,
  forecastTrend,
  formatINR,
  DEMO_FINANCIAL_PROFILE,
} from "@/financial-engine";

const scoreLabels: [string, "emergencyFund" | "savingsRate" | "debtBurden" | "expenseStability" | "incomeStability"][] = [
  ["Emergency fund", "emergencyFund"],
  ["Savings rate", "savingsRate"],
  ["Debt burden", "debtBurden"],
  ["Expense stability", "expenseStability"],
  ["Income stability", "incomeStability"],
];

const mockCashFlow = [
  { month: "JAN", income: 65000, expenses: 39000 },
  { month: "FEB", income: 65000, expenses: 41000 },
  { month: "MAR", income: 67000, expenses: 43000 },
  { month: "APR", income: 65000, expenses: 40000 },
  { month: "MAY", income: 68000, expenses: 45000 },
  { month: "JUN", income: 65000, expenses: 42000 },
];

export default function Dashboard() {
  const profile = DEMO_FINANCIAL_PROFILE;
  const metrics = calculateDerived(profile);
  const forecast = forecastTrend(profile, 6);

  return (
    <main className="dashboard">
      <SiteNav />

      {/* Header */}
      <div className="dashboard-head">
        <div>
          <MetricLabel>FINANCIAL TWIN — LIVE STATE</MetricLabel>
          <h1>Your financial command center.</h1>
        </div>
        <span className="active-status">
          <i /> MODEL ACTIVE
        </span>
      </div>

      {/* 4 Metric Top Strip */}
      <section className="metric-strip">
        <div className="top-metric">
          <MetricLabel>NET WORTH</MetricLabel>
          <strong>
            <AnimatedNumber value={metrics.netWorth} prefix="₹" />
          </strong>
          <span className="metric-delta">+12.4% this quarter</span>
        </div>

        <div className="top-metric">
          <MetricLabel>MONTHLY INCOME</MetricLabel>
          <strong>
            <AnimatedNumber value={profile.income + profile.otherIncome} prefix="₹" />
          </strong>
          <span className="metric-delta">vs. last month</span>
        </div>

        <div className="top-metric">
          <MetricLabel>MONTHLY EXPENSES</MetricLabel>
          <strong>
            <AnimatedNumber value={metrics.totalExpenses} prefix="₹" />
          </strong>
          <span className="metric-delta">Essential + Discretionary</span>
        </div>

        <div className="top-metric">
          <MetricLabel>SAVINGS RATE</MetricLabel>
          <strong>
            <AnimatedNumber value={metrics.savingsRate} decimals={1} suffix="%" />
          </strong>
          <span className="metric-delta">↑ above target</span>
        </div>
      </section>

      {/* Top Grid: Net Worth & Resilience Breakdown */}
      <section className="dashboard-grid top-grid">
        <GlassCard className="net-worth-card">
          <SectionHeading
            eyebrow="NET WORTH / TRAJECTORY"
            title="A stronger position, month by month."
            detail="Your assets are outpacing your obligations."
          />
          <div className="net-worth-total">
            <AnimatedNumber value={metrics.netWorth} prefix="₹" />
            <span>+ {formatINR(metrics.monthlySavings)} projected monthly</span>
          </div>
          <div className="mini-line">
            {forecast.map((point, i) => (
              <span
                key={point.month}
                style={{ height: `${28 + (point.netWorth - 600000) / 3600}px` }}
                className={i === 0 ? "muted-bar" : ""}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="resilience-card">
          <SectionHeading
            eyebrow="RESILIENCE / 100"
            title="How much can you absorb?"
          />
          <div className="resilience-layout">
            <ResilienceRing score={metrics.resilienceScore} band={metrics.resilienceBand} />
            <div className="score-bars">
              {scoreLabels.map(([label, key]) => (
                <div className="score-row" key={key}>
                  <div>
                    <span>{label}</span>
                    <b>{metrics.resilienceBreakdown[key]}</b>
                  </div>
                  <div className="score-track">
                    <i style={{ width: `${(metrics.resilienceBreakdown[key] / 30) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Lower Grid: Cash Flow & Runway Gauge */}
      <section className="dashboard-grid lower-grid">
        <GlassCard className="cash-card">
          <SectionHeading
            eyebrow="CASH FLOW / MONTHLY"
            title="The rhythm of your money."
          />
          <div className="cash-stats">
            <div>
              <MetricLabel>MONTHLY SAVINGS</MetricLabel>
              <strong>
                <AnimatedNumber value={metrics.monthlySavings} prefix="₹" />
              </strong>
            </div>
            <div>
              <MetricLabel>MONTHLY BURN</MetricLabel>
              <strong>
                <AnimatedNumber value={metrics.monthlyBurn} prefix="₹" />
              </strong>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={mockCashFlow} barGap={5}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="month" tick={{ fill: "var(--muted-text)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "var(--surface)" }}
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--foreground)" }}
                formatter={(v) => formatINR(Number(v))}
              />
              <Bar dataKey="income" fill="var(--accent)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--slate)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-key">
            <span><i className="key-income" /> INCOME</span>
            <span><i className="key-expense" /> EXPENSES</span>
          </div>
        </GlassCard>

        <GlassCard className="runway-card">
          <SectionHeading
            eyebrow="RUNWAY / LIQUIDITY"
            title="Room to keep moving."
            detail="At your current monthly burn."
          />
          <RunwayGauge months={metrics.runwayMonths} />
          <div className="runway-foot">
            <span>Emergency fund <b>{formatINR(profile.emergencyFund)}</b></span>
            <span>Safety threshold <b>6.0 mo</b></span>
          </div>
        </GlassCard>
      </section>

      {/* 6-Month Projected Forecast Area Chart */}
      <GlassCard className="forecast-card">
        <SectionHeading
          eyebrow="FORECAST / NEXT 6 MONTHS"
          title="The shape of your current trajectory."
          detail="Projected net worth, modeled from your live state."
        />
        <ResponsiveContainer width="100%" height={270}>
          <AreaChart data={forecast}>
            <defs>
              <linearGradient id="emeraldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} tick={{ fill: "var(--muted-text)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              tick={{ fill: "var(--muted-text)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--foreground)" }}
              labelFormatter={(v) => `Month ${v}`}
              formatter={(v) => [formatINR(Number(v)), "Net worth"]}
            />
            <Area type="monotone" dataKey="netWorth" stroke="var(--accent)" strokeWidth={2} fill="url(#emeraldFill)" dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Stress CTA Footer Banner */}
      <section className="stress-cta">
        <div>
          <MetricLabel>SCENARIO ENGINE / READY</MetricLabel>
          <h2>What if everything changed?</h2>
          <p>Test the variables that feel impossible to model alone.</p>
        </div>
        <div className="stress-list">
          <span>JOB LOSS</span>
          <span>RENT INCREASE</span>
          <span>UNEXPECTED EXPENSE</span>
          <span>INCOME CHANGE</span>
        </div>
        <PrimaryButton href="/simulator">RUN A STRESS TEST</PrimaryButton>
      </section>
    </main>
  );
}
