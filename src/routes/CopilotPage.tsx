import { useState, useRef, useEffect } from "react";
import { fetchCopilotAnalysis, SUGGESTED_QUESTIONS, CopilotResponse } from "../lib/copilotApi";
import type { DerivedMetrics, SimulationResult } from "../../financial-engine/types";

interface CopilotPageProps {
  navigate?: (route: string) => void;
  metrics?: DerivedMetrics;
  activeScenario?: SimulationResult | null;
}

const DEFAULT_METRICS: DerivedMetrics = {
  totalExpenses: 42000,
  monthlySavings: 23000,
  savingsRate: 35.38,
  monthlyBurn: 37000,
  netWorth: 600000,
  runwayMonths: 10.8,
  resilienceScore: 82,
  resilienceBand: "healthy",
  resilienceBreakdown: {
    emergencyFund: 30,
    savingsRate: 22,
    debtBurden: 20,
    expenseStability: 10,
    incomeStability: 10,
  },
};

export function CopilotPage({
  navigate,
  metrics = DEFAULT_METRICS,
  activeScenario = null,
}: CopilotPageProps) {
  const [messages, setMessages] = useState<CopilotResponse[]>(() => [
    {
      id: "welcome_1",
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: `Greetings. I am the **FinanceGuard Copilot**, integrated with your live financial twin (Resilience: **${metrics.resilienceScore}/100**, Runway: **${metrics.runwayMonths} mo**).\n\nAsk me any diagnostic question regarding your emergency buffers, spending shifts, or scenario stress-tests.`,
      suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 3),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (queryText?: string) => {
    const query = (queryText || inputQuestion).trim();
    if (!query || isTyping) return;

    const userMsg: CopilotResponse = {
      id: "usr_" + Date.now(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsTyping(true);

    try {
      const response = await fetchCopilotAnalysis(query, metrics, activeScenario);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error("Copilot Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNav = (route: string) => {
    if (navigate) {
      navigate(route);
    } else {
      window.location.href = route;
    }
  };

  return (
    <main className="dashboard">
      {/* Site Navigation Bar using Person 2's CSS */}
      <header className="site-nav">
        <div className="wordmark" onClick={() => handleNav("/")} style={{ cursor: "pointer" }}>
          FINANCE<span>GUARD</span>
        </div>
        <nav>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNav("/dashboard"); }}>
            TWIN
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNav("/simulator"); }}>
            SIMULATOR
          </a>
          <a href="#" className="active" onClick={(e) => { e.preventDefault(); handleNav("/copilot"); }}>
            COPILOT
          </a>
        </nav>
        <div className="demo-label">
          <i /> DEMO MODE
        </div>
      </header>

      {/* Header Section */}
      <div className="dashboard-head">
        <div>
          <span className="metric-label">FINANCEGUARD / COPILOT</span>
          <h1>A next step, made visible.</h1>
          <p style={{ color: "var(--muted-text)", fontSize: "14px", marginTop: "0.5rem" }}>
            Real-time AI diagnostic intelligence translating your financial twin into high-leverage actions.
          </p>
        </div>
        <span className="active-status">
          <i /> COPILOT ONLINE
        </span>
      </div>

      {/* Main Grid */}
      <section className="dashboard-grid top-grid">
        {/* Left Side: Live Twin Context & Suggested Prompts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="instrument-card">
            <span className="metric-label">LIVE TWIN TELEMETRY</span>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.8rem", fontSize: "12px", fontFamily: "monospace" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
                <span style={{ color: "var(--muted-text)" }}>RESILIENCE SCORE</span>
                <b style={{ color: "var(--accent)" }}>{metrics.resilienceScore}/100</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
                <span style={{ color: "var(--muted-text)" }}>RUNWAY</span>
                <span>{metrics.runwayMonths} months</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
                <span style={{ color: "var(--muted-text)" }}>MONTHLY SAVINGS</span>
                <span style={{ color: "var(--accent)" }}>₹{metrics.monthlySavings.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted-text)" }}>NET WORTH</span>
                <span>₹{(metrics.netWorth / 100000).toFixed(2)}L</span>
              </div>
            </div>
          </div>

          <div className="instrument-card">
            <span className="metric-label">SUGGESTED AUDIT PROMPTS</span>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  style={{
                    textAlign: "left",
                    padding: "0.6rem 0.8rem",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--foreground)",
                    fontSize: "11px",
                    cursor: "pointer",
                    borderRadius: "var(--radius)",
                  }}
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Chat Panel */}
        <div className="instrument-card" style={{ display: "flex", flexDirection: "column", height: "600px", padding: "1.5rem" }}>
          {/* Chat Stream */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", paddingRight: "0.5rem" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  background: msg.sender === "user" ? "var(--accent)" : "var(--surface)",
                  color: msg.sender === "user" ? "var(--background)" : "var(--foreground)",
                  border: msg.sender === "user" ? "none" : "1px solid var(--line)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                {msg.diagnosisBadge && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      padding: "2px 6px",
                      borderRadius: "2px",
                      background: "var(--panel)",
                      color: "var(--accent)",
                      border: "1px solid var(--line)",
                      display: "inline-block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {msg.diagnosisBadge.label}
                  </span>
                )}

                <div>{msg.content}</div>

                {msg.actionSteps && msg.actionSteps.length > 0 && (
                  <div style={{ marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: "1px solid var(--line)", fontSize: "11px" }}>
                    <b style={{ color: "var(--accent)", display: "block", marginBottom: "0.3rem" }}>RECOMMENDED ACTIONS:</b>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                      {msg.actionSteps.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <span style={{ display: "block", textAlign: "right", fontSize: "9px", opacity: 0.6, marginTop: "0.4rem", fontFamily: "monospace" }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ fontSize: "11px", color: "var(--muted-text)", fontFamily: "monospace" }}>
                <i>Analyzing telemetry...</i>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask Copilot about your twin..."
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                color: "var(--foreground)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isTyping}
              style={{
                padding: "0.75rem 1.2rem",
                background: "var(--accent)",
                color: "var(--background)",
                border: "0",
                fontWeight: "bold",
                fontSize: "11px",
                letterSpacing: "0.1em",
                cursor: "pointer",
                borderRadius: "var(--radius)",
                opacity: !inputQuestion.trim() || isTyping ? 0.5 : 1,
              }}
            >
              SEND
            </button>
          </form>
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <button
          onClick={() => handleNav("/dashboard")}
          style={{ background: "none", border: "none", color: "var(--accent)", font: "10px monospace", letterSpacing: "0.12em", cursor: "pointer" }}
        >
          ← RETURN TO YOUR TWIN
        </button>
      </div>
    </main>
  );
}

export default CopilotPage;