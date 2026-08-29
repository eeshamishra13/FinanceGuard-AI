import React from 'react';
import { Bot, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AICopilotBoxProps {
  explanation: string;
  recommendation: string;
  scenarioTitle: string;
  isSimulating: boolean;
  onConsultCopilot?: () => void;
}

export const AICopilotBox: React.FC<AICopilotBoxProps> = ({
  explanation,
  recommendation,
  scenarioTitle,
  isSimulating,
  onConsultCopilot,
}) => {
  return (
    <div className={`rounded-xl bg-[#280B0F]/90 border-l-4 border-l-[#C6B39A] border-y border-r border-[#C6B39A]/20 p-5 sm:p-6 shadow-ledger transition-opacity duration-500 backdrop-blur-sm ${
      isSimulating ? 'opacity-40' : 'opacity-100'
    }`}>
      {/* Header with italic serif / mono label */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#C6B39A]/15">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#3B1319] border border-[#C6B39A]/30 text-[#C6B39A]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif italic text-base font-semibold text-[#DFD5C6]">
              AI Copilot Diagnostic
            </span>
            <span className="font-mono text-[10px] text-[#7B694E] ml-2 tracking-widest uppercase">
              ? Real-time Telemetry Analysis
            </span>
          </div>
        </div>

        <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#3B1319] text-[#C6B39A] border border-[#7B694E]/30">
          Scenario: {scenarioTitle}
        </span>
      </div>

      {/* Explanation Text */}
      <div className="space-y-3 font-sans text-sm text-[#DFD5C6] leading-relaxed">
        <p className="font-medium text-slate-200">
          {explanation}
        </p>

        {/* Concrete Recommendation Accent */}
        <div className="p-3.5 rounded-lg bg-[#3B1319]/80 border border-[#7B694E]/40 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#C6B39A] mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C6B39A] font-semibold block">
              Concrete Actionable Recommendation:
            </span>
            <p className="text-xs text-[#DFD5C6] leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Action footer */}
      {onConsultCopilot && (
        <div className="mt-4 pt-3 border-t border-[#C6B39A]/10 flex items-center justify-between text-xs">
          <span className="text-[#7B694E] text-[11px]">
            Ready for plug-and-play LLM engine integration
          </span>
          <button
            type="button"
            onClick={onConsultCopilot}
            className="font-mono text-xs font-semibold text-[#C6B39A] hover:text-[#DFD5C6] flex items-center gap-1.5 transition-colors group"
          >
            <span>Consult AI Copilot in Full Assistant</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};