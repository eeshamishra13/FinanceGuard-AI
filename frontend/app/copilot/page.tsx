"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { GlassCard, MetricLabel, SectionHeading, AnimatedNumber } from "@/components/ui/finance";
import {
  calculateDerived,
  runSimulation,
  formatINR,
  getPresetScenarios,
  DEMO_FINANCIAL_PROFILE,
} from "@/financial-engine";
import type { DerivedMetrics, SimulationResult } from "@/financial-engine";
import {
  Bot,
  Send,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  HelpCircle,
  Activity,
  Cpu,
} from "lucide-react";

interface MessageItem {
  id: string;
  sender: "user" | "copilot";
  timestamp: string;
  query?: string;
  summary: string;
  keyInsights?: string[];
  recommendedActions?: string[];
  isAIGenerated?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How long can I sustain my current burn rate if income stops?",
  "What is the single highest-leverage action to improve my financial runway?",
  "What happens to my resilience score if I reduce discretionary spending by 15%?",
  "How much emergency savings should I allocate right now?",
];

function CopilotContent() {
  const searchParams = useSearchParams();
  const scenarioParam = searchParams.get("scenario");

  const baselineProfile = DEMO_FINANCIAL_PROFILE;
  const baselineMetrics = calculateDerived(baselineProfile);
  const presets = getPresetScenarios();

  const selectedPreset = scenarioParam
    ? presets.find((p) => p.id === scenarioParam)
    : null;

  const activeSimulation: SimulationResult | null = selectedPreset
    ? runSimulation(baselineProfile, selectedPreset.scenario)
    : null;

  const [inputQuestion, setInputQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>(() => [
    {
      id: "welcome_msg",
      sender: "copilot",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      summary: `Greetings. I am the FinanceGuard AI Copilot, linked directly to your living financial twin (Resilience: ${baselineMetrics.resilienceScore}/100, Runway: ${baselineMetrics.runwayMonths} mo).`,
      keyInsights: [
        `Deterministic baseline Net Worth is ${formatINR(baselineMetrics.netWorth)}.`,
        `Current monthly burn rate is ${formatINR(baselineMetrics.monthlyBurn)} against retained surplus of ${formatINR(baselineMetrics.monthlySavings)}/mo.`,
        selectedPreset ? `Active shock analyzed: ${selectedPreset.label} (${activeSimulation?.delta.resilience} pts resilience delta).` : "System is in baseline equilibrium.",
      ],
      recommendedActions: [
        "Ask diagnostic questions regarding your runway, debt amortization, or shock buffers below.",
        "Or click any suggested query pill to execute an instant telemetry assessment.",
      ],
      isAIGenerated: false,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isTyping) return;

    const userMsg: MessageItem = {
      id: "user_" + Date.now(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      summary: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          metrics: baselineMetrics,
          activeScenario: activeSimulation,
          profile: baselineProfile,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const copilotMsg: MessageItem = {
          id: "copilot_" + Date.now(),
          sender: "copilot",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          summary: data.summary,
          keyInsights: data.keyInsights,
          recommendedActions: data.recommendedActions,
          isAIGenerated: data.isAIGenerated,
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        throw new Error("Server response non-200");
      }
    } catch (err) {
      console.error("Copilot fetch failed:", err);
      const fallbackMsg: MessageItem = {
        id: "copilot_" + Date.now(),
        sender: "copilot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        summary: `Analysis for: "${query}". Your financial twin maintains ${baselineMetrics.runwayMonths} months of survival runway with a resilience score of ${baselineMetrics.resilienceScore}/100.`,
        keyInsights: [
          `Monthly savings rate sits at ${baselineMetrics.savingsRate.toFixed(1)}%.`,
          `Essential monthly burn is ${formatINR(baselineMetrics.monthlyBurn)}.`,
        ],
        recommendedActions: [
          "Lock 6 months of essential burn in emergency liquid yield.",
          "Maintain current expense ceiling.",
        ],
        isAIGenerated: false,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <main className="dashboard">
      <SiteNav />

      {/* Header */}
      <div className="dashboard-head">
        <div>
          <MetricLabel>FINANCIAL TWIN // AI COPILOT</MetricLabel>
          <h1>A next step, made visible.</h1>
          <p style={{ color: "var(--muted-text)", fontSize: "14px", marginTop: "0.5rem" }}>
            Real-time conversational intelligence translating your financial digital twin into high-leverage actions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs font-mono text-[var(--accent)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
          <span>COPILOT INTELLIGENCE LAYER ACTIVE</span>
        </div>
      </div>

      {/* Telemetry Status Strip */}
      <section className="metric-strip" style={{ marginBottom: "1.5rem" }}>
        <div className="top-metric">
          <MetricLabel>RESILIENCE SCORE</MetricLabel>
          <strong style={{ color: "var(--accent)" }}>{baselineMetrics.resilienceScore}/100</strong>
          <span className="metric-delta">{baselineMetrics.resilienceBand.toUpperCase()}</span>
        </div>
        <div className="top-metric">
          <MetricLabel>SURVIVAL RUNWAY</MetricLabel>
          <strong>{baselineMetrics.runwayMonths.toFixed(1)} MO</strong>
          <span className="metric-delta">at current burn</span>
        </div>
        <div className="top-metric">
          <MetricLabel>MONTHLY SURPLUS</MetricLabel>
          <strong style={{ color: "var(--accent)" }}>{formatINR(baselineMetrics.monthlySavings)}</strong>
          <span className="metric-delta">{baselineMetrics.savingsRate.toFixed(1)}% savings rate</span>
        </div>
        <div className="top-metric">
          <MetricLabel>SIMULATION CONTEXT</MetricLabel>
          <strong style={{ fontSize: "1.2rem", paddingTop: "0.5rem" }}>
            {selectedPreset ? selectedPreset.label : "BASELINE"}
          </strong>
          <span className="metric-delta">
            {selectedPreset ? `${activeSimulation?.delta.resilience} pts delta` : "No active shock"}
          </span>
        </div>
      </section>

      {/* Conversational Window */}
      <GlassCard className="flex flex-col h-[650px] p-6 justify-between">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {msg.sender === "user" ? (
                <div className="max-w-[75%] p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--foreground)] font-sans">
                  {msg.summary}
                </div>
              ) : (
                <div className="max-w-[90%] p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-[var(--surface)] text-[var(--accent)]">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--foreground)] tracking-wider">
                        FINANCEGUARD COPILOT
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--muted-text)]">
                      {msg.isAIGenerated ? "LLM ENGINE (GPT-4o)" : "DETERMINISTIC ENGINE"}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--foreground)] leading-relaxed font-normal">
                    {msg.summary}
                  </p>

                  {msg.keyInsights && msg.keyInsights.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold block">
                        KEY ANALYTICAL INSIGHTS:
                      </span>
                      <ul className="space-y-1 text-xs text-[var(--muted-text)]">
                        {msg.keyInsights.map((insight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[var(--accent)] font-mono">›</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.recommendedActions && msg.recommendedActions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold block">
                        RECOMMENDED ACTIONS:
                      </span>
                      <div className="space-y-1.5">
                        {msg.recommendedActions.map((action, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--foreground)] flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] mt-0.5 shrink-0" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--panel)] border border-[var(--line)] w-fit text-xs font-mono text-[var(--accent)]">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-ping" />
              <span>Analyzing financial telemetry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions & Input Bar */}
        <div className="pt-4 border-t border-[var(--line)] space-y-3">
          {/* Suggested Prompt Pills */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
                className="px-2.5 py-1 rounded bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] text-[11px] font-mono text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a diagnostic question about your runway, emergency fund, or scenario..."
              disabled={isTyping}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none font-sans"
            />
            <button
              type="submit"
              disabled={isTyping || !inputQuestion.trim()}
              className="px-5 py-3 bg-[var(--accent)] text-[var(--background)] rounded-lg font-mono text-xs font-bold uppercase transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </GlassCard>
    </main>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="dashboard"><SiteNav /><div className="dashboard-head"><h1>Loading Copilot...</h1></div></div>}>
      <CopilotContent />
    </Suspense>
  );
}
