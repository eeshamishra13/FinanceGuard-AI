import React, { useState, useRef, useEffect } from 'react';
import { 
  generateCopilotResponse, 
  SUGGESTED_QUESTIONS 
} from '../lib/copilotMock';
import { 
  CopilotMessage, 
  FinancialMetrics, 
  StressTestResult 
} from '../types/finance';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  SlidersHorizontal,
  Activity,
  ChevronRight
} from 'lucide-react';

interface CopilotPageProps {
  navigate: (route: string) => void;
  metrics: FinancialMetrics;
  activeScenario: StressTestResult | null;
}

export const CopilotPage: React.FC<CopilotPageProps> = ({
  navigate,
  metrics,
  activeScenario,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    return [
      {
        id: 'welcome_1',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Hello! I am **FinanceGuard Copilot**, your autonomous financial diagnostic intelligence.

I monitor your live **Financial Twin** (Resilience: **${metrics.resilience}/100**, Runway: **${metrics.runwayMonths} months**). Ask me any diagnostic question or pick from the suggested prompts below to analyze your stress resilience, purchasing decisions, or recovery options.`,
        suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 4),
      },
    ];
  });

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isTyping) return;

    const userMsg: CopilotMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateCopilotResponse(query, metrics, activeScenario);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 450);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Chat history reset. How can I assist with your **Financial Twin** today?`,
        suggestedFollowUps: SUGGESTED_QUESTIONS,
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-widest">
            <Bot className="w-4 h-4" />
            <span>AI Financial Twin Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            FinanceGuard AI Copilot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deterministic diagnostic analysis and stress-test advisory powered by your real-time financial metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/simulator')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-slate-300 text-xs font-semibold hover:border-emerald-500/40 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulator</span>
          </button>
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-surface-border text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Live Twin Context Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-surface-card border border-surface-border p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Live Twin Context</h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                SYNCED
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Resilience:</span>
                <span className="font-bold text-base text-emerald-400">{metrics.resilience}/100</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Emergency Runway:</span>
                <span className="font-bold text-white">{metrics.runwayMonths} months</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Monthly Savings:</span>
                <span className="font-bold text-emerald-300">₹{metrics.monthlySavings.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex justify-between items-center">
                <span className="text-slate-400 font-sans">Net Worth:</span>
                <span className="font-bold text-white">₹{(metrics.netWorth / 100000).toFixed(2)}L</span>
              </div>
            </div>

            {activeScenario && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Active Simulated Scenario:
                </span>
                <p className="font-semibold text-slate-200">{activeScenario.scenarioTitle}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Resilience shifted from {activeScenario.before.resilience} → {activeScenario.after.resilience}.
                </p>
              </div>
            )}
          </div>

          {/* Quick Suggested Questions Box */}
          <div className="rounded-2xl bg-surface-card border border-surface-border p-5 shadow-xl backdrop-blur-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suggested Questions</span>
            </h3>

            <div className="flex flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-xs p-2.5 rounded-xl bg-surface-elevated hover:bg-cyan-950/40 hover:border-cyan-500/40 border border-surface-border text-slate-300 hover:text-cyan-200 transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chat Stream Container */}
        <div className="lg:col-span-8 flex flex-col h-[680px] rounded-3xl bg-surface-card border border-surface-border shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-glow-cyan">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-sm space-y-3.5 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-tr-none shadow-lg'
                    : 'bg-[#0f1728] border border-surface-border text-slate-200 rounded-tl-none shadow-xl'
                }`}>
                  {msg.diagnosisBadge && (
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        msg.diagnosisBadge.variant === 'safe'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : msg.diagnosisBadge.variant === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : msg.diagnosisBadge.variant === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {msg.diagnosisBadge.label}
                      </span>
                    </div>
                  )}

                  <div className="text-xs sm:text-sm leading-relaxed space-y-2">
                    {msg.content.split('\n\n').map((para, pIdx) => {
                      if (para.startsWith('### ')) {
                        return <h4 key={pIdx} className="font-bold text-white text-sm mt-2 mb-1">{para.replace('### ', '')}</h4>;
                      }
                      if (para.startsWith('* ') || para.startsWith('1. ')) {
                        return (
                          <div key={pIdx} className="pl-2 space-y-1">
                            {para.split('\n').map((line, lIdx) => (
                              <div key={lIdx} className="text-slate-300">
                                {line}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p key={pIdx}>{para}</p>;
                    })}
                  </div>

                  {msg.metricsHighlight && msg.metricsHighlight.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      {msg.metricsHighlight.map((m, mIdx) => (
                        <div key={mIdx} className="p-2.5 rounded-xl bg-surface border border-surface-border font-mono text-xs">
                          <span className="text-[10px] text-slate-400 font-sans block">{m.label}</span>
                          <span className="font-bold text-slate-100">{m.value}</span>
                          {m.change && (
                            <span className={`text-[10px] block ${m.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {m.change}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.actionSteps && msg.actionSteps.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-surface/80 border border-surface-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                        Recommended Immediate Steps:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {msg.actionSteps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((fUp, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => handleSendMessage(fUp)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors"
                        >
                          💬 {fUp}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 block text-right font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#0f1728] border border-surface-border text-slate-400 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>Diagnosing Financial Twin telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-surface-border bg-[#090d16]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask about your resilience, laptop purchase, emergency runway, or job loss..."
                className="flex-1 px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isTyping}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <span>Ask</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
