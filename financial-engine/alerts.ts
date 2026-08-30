import type { FinancialTwinCore, OrganizationSettings } from "./twinTypes.ts";
import { validateOrganizationSettings } from "./twinTypes.ts";
import type { EconomicSignal } from "./signals.ts";
import { mapSignalsToExposureShocks } from "./signals.ts";
import { calculateTwinExposureImpacts } from "./exposure.ts";
import { safeDivide, roundTo } from "./engine.ts";

export interface FinancialAlert {
  id: string;
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  timestamp: string;
  whatHappened: string;
  whyItMatters: string;
  financialImpact: string;
  recommendedAction: string;
  deltaMonthlyOpEx: number;
  deltaRunwayMonths: number;
}

/**
 * Evaluates external signals against the twin to generate structured, actionable financial alerts.
 * Accepts optional OrganizationSettings to respect custom buffer targets, beta overrides, and category filtering.
 */
export function generateFinancialAlerts(
  twin: FinancialTwinCore,
  signals: EconomicSignal[],
  settings?: OrganizationSettings
): FinancialAlert[] {
  if (settings) {
    validateOrganizationSettings(settings);
  }

  // Apply settingsOverrides to exposures
  let activeExposures = twin.exposures;
  if (settings) {
    // 1. Filter active categories
    if (settings.activeCategories && settings.activeCategories.length > 0) {
      activeExposures = activeExposures.filter((exp) =>
        settings.activeCategories.includes(exp.category)
      );
    }
    // 2. Apply custom beta overrides
    if (settings.customBetaOverrides) {
      activeExposures = activeExposures.map((exp) => {
        const overrideBeta = settings.customBetaOverrides?.[exp.category];
        if (overrideBeta !== undefined) {
          return { ...exp, beta: overrideBeta };
        }
        return exp;
      });
    }
  }

  const modifiedTwin: FinancialTwinCore = {
    ...twin,
    exposures: activeExposures,
  };

  const shocks = mapSignalsToExposureShocks(modifiedTwin, signals);
  const impactResults = calculateTwinExposureImpacts(modifiedTwin, shocks);
  const baseRunway = roundTo(safeDivide(modifiedTwin.totalLiquidCash, Math.max(1, modifiedTwin.totalMonthlyBurn)), 1);

  const alerts: FinancialAlert[] = [];

  for (const signal of signals) {
    const impact = impactResults.impacts.find((imp) => {
      if (imp.signalKey === signal.key) return true;
      if (signal.key === "fuel_diesel" && (imp.signalKey === "diesel" || imp.signalKey === "fuel")) return true;
      if (signal.key === "rbi_repo" && imp.signalKey === "interest_rate") return true;
      return false;
    });

    const isRelevant = impact !== undefined;
    const deltaOpEx = impact?.deltaMonthlyCost ?? 0;
    const newBurn = Math.max(1, modifiedTwin.totalMonthlyBurn + deltaOpEx);
    const newRunway = roundTo(safeDivide(modifiedTwin.totalLiquidCash, newBurn), 1);
    const deltaRunway = roundTo(newRunway - baseRunway, 1);

    let severity: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (isRelevant) {
      if (Math.abs(deltaOpEx) >= 8000 || Math.abs(deltaRunway) >= 0.5 || signal.isSignificantChange) {
        severity = "HIGH";
      } else {
        severity = "MEDIUM";
      }
    }

    const formattedChange = signal.percentageChange > 0 ? `+${signal.percentageChange.toFixed(2)}%` : `${signal.percentageChange.toFixed(2)}%`;
    const title = `${signal.name} ${formattedChange} — ${isRelevant ? "Exposure Triggered" : "Monitored Signal"}`;

    const whatHappened = `${signal.name} moved ${formattedChange} to ${signal.currentValue.toLocaleString("en-IN")} ${signal.unit} (Source: ${signal.sourceName}).`;
    const whyItMatters = isRelevant
      ? `${modifiedTwin.entityName} maintains direct operational exposure (${impact.signalKey}) with baseline monthly spend of ₹${impact.baselineMonthlySpend.toLocaleString("en-IN")}/mo (β = ${impact.beta.toFixed(2)}).`
      : `No direct operational exposure line identified in ${modifiedTwin.entityName}'s current balance sheet.`;

    const financialImpact = deltaOpEx !== 0
      ? `Projected monthly OpEx shifts by ${deltaOpEx > 0 ? "+" : ""}₹${deltaOpEx.toLocaleString("en-IN")}/mo, adjusting effective burn runway by ${deltaRunway > 0 ? "+" : ""}${deltaRunway} months.`
      : `General macro movement monitored; direct cash burn impact is negligible.`;

    const bufferMonths = settings?.emergencyBufferMonths ?? (modifiedTwin.twinType === "business" ? 3 : 6);
    const recommendedAction = isRelevant && deltaOpEx > 0
      ? `Earmark +₹${Math.round(deltaOpEx * bufferMonths).toLocaleString("en-IN")} in Tier 2 emergency operating liquidity buffer.`
      : `Maintain standard monitoring; no immediate capital reallocation required.`;

    alerts.push({
      id: `alert_${signal.key}`,
      title,
      severity,
      category: signal.key,
      timestamp: signal.fetchedAt,
      whatHappened,
      whyItMatters,
      financialImpact,
      recommendedAction,
      deltaMonthlyOpEx: deltaOpEx,
      deltaRunwayMonths: deltaRunway,
    });
  }

  const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  alerts.sort((a, b) => order[b.severity] - order[a.severity]);
  return alerts;
}
