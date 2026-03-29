import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Zap,
  AlertCircle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";

interface TarpitWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPivot: () => void;
  competitors: any[];
  scoreResult?: any;
}

export function TarpitWarningModal({
  isOpen,
  onClose,
  onPivot,
  competitors,
  scoreResult,
}: TarpitWarningModalProps) {
  const [showEvolutionDiff, setShowEvolutionDiff] = useState(false);
  const { user } = useAuth();

  const handleDeepReportClick = () => {
    setShowEvolutionDiff(true);
  };

  if (!isOpen) return null;

  // Determine UI State
  const status = scoreResult?.status || "success";
  const isTarpit = scoreResult?.isTarpit;

  /**
   *
   */
  const renderContent = () => {
    if (status === "data_desert") {
      return (
        <div className="px-8 py-8 space-y-8">
          <div className="bg-amber-500/10 rounded-lg p-5 border border-amber-500/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                Data Desert Detected
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              We couldn't find a semantic footprint for this market. Either the
              terminology used is flawed, or this market doesn't exist. Proceed
              with caution.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
          >
            ACKNOWLEDGE & CLOSE
          </button>
        </div>
      );
    }

    if (status === "partial_data") {
      return (
        <div className="px-8 py-8 space-y-8">
          <div className="bg-blue-500/10 rounded-lg p-5 border border-blue-500/50">
            <div className="flex items-center gap-2 mb-3">
              <Info size={20} className="text-blue-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">
                Partial Score (API Unavailable)
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              Market size data could not be verified due to an external API
              failure. We have calculated a partial score based on vector
              uniqueness alone.
            </p>
            <p className="text-slate-400 text-xs mt-4">
              Uniqueness Score: {scoreResult?.uniqueness?.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
          >
            PROCEED WITH PARTIAL DATA
          </button>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="px-8 py-8 space-y-8">
          <div className="bg-rose-500/10 rounded-lg p-5 border border-rose-500/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={20} className="text-rose-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500">
                Raw Market Signal (Extraction Error)
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              Failed to extract structured data properly. Showing raw market
              signals instead.
            </p>
            <p className="text-rose-400 text-xs mt-2">{scoreResult.error}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
          >
            DISMISS
          </button>
        </div>
      );
    }

    // Default Tarpit View
    return (
      <div className="px-8 py-8 space-y-8">
        <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Market Saturation Proof
            </h3>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm">
            Based on deep validation of {competitors.length} competitors, your
            current positioning closely overlaps with established players.{" "}
            {scoreResult?.message ? (
              <span className="block mt-2 font-semibold text-indigo-400">
                Note: {scoreResult.message}
              </span>
            ) : (
              "The true competitor score indicates a high risk of feature parity and identical messaging without clear differentiation."
            )}
          </p>

          {/* Wedge Visualization / Quote */}
          {competitors[0]?.extraction && (
            <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-md">
              <div className="text-xs text-slate-500 uppercase font-bold mb-2">
                Example Market Clutter (Source Attribution)
              </div>
              <blockquote className="italic text-slate-300 text-sm border-l-2 border-indigo-500 pl-3">
                "{competitors[0].extraction.exact_quote}"
              </blockquote>
              {competitors[0].extraction.exa_url && (
                <a
                  href={competitors[0].extraction.exa_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
                >
                  Verify Source &rarr;
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleDeepReportClick}
            className="w-full flex items-center justify-between px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-none transition-colors group"
          >
            <span className="tracking-wide">VIEW 3 LUCRATIVE SUB-NICHES</span>
            <ArrowRight
              size={20}
              className="transform group-hover:translate-x-1 transition-transform"
            />
          </button>
          <button
            onClick={onClose}
            className="text-center text-sm font-medium text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-4"
          >
            I accept the high failure risk. Proceed anyway.
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        {!showEvolutionDiff ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-2xl bg-slate-900 text-slate-200 shadow-2xl overflow-hidden font-sans border border-slate-800"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${status === "data_desert" ? "bg-amber-500/10" : status === "partial_data" ? "bg-blue-500/10" : "bg-rose-500/10"}`}
              >
                <ShieldAlert
                  size={24}
                  className={
                    status === "data_desert"
                      ? "text-amber-500"
                      : status === "partial_data"
                        ? "text-blue-500"
                        : "text-rose-500"
                  }
                />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {status === "data_desert"
                    ? "Data Desert"
                    : status === "partial_data"
                      ? "Partial Score"
                      : status === "error"
                        ? "Raw Market Signal"
                        : "Tarpit Warning"}
                </h2>
                <p className="text-slate-400 mt-1">
                  {status === "data_desert"
                    ? "No clear competitors found."
                    : status === "partial_data"
                      ? "Incomplete market size data."
                      : status === "error"
                        ? "Extraction failed."
                        : "High market saturation detected. Strategic pivot recommended."}
                </p>
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl bg-[#1A1A1A] text-white shadow-2xl border border-[#333] h-[80vh] flex flex-col"
          >
            {/* Evolution Diff Content here */}
            <div className="px-6 py-5 border-b border-[#333] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black uppercase tracking-widest text-[#FFF]">
                Evolution Diff
              </h2>
              <button
                onClick={() => setShowEvolutionDiff(false)}
                className="text-sm text-[#888] hover:text-[#FFF]"
              >
                BACK TO WARNING
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-8">
              {/* Left: Tarpit (Grayscale) */}
              <div className="border border-[#333] p-6 bg-[#222] opacity-70 grayscale">
                <div className="text-xs font-bold uppercase tracking-widest text-[#888] mb-4">
                  Hard Mode (Tarpit)
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] text-[#666] uppercase">
                      Audience
                    </div>
                    <div className="text-sm">"Everyone" or Broad Category</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666] uppercase">
                      Price
                    </div>
                    <div className="text-sm">Race to the bottom ($15/mo)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666] uppercase">GTM</div>
                    <div className="text-sm">Saturated Channels (Ads, SEO)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666] uppercase">
                      Scope
                    </div>
                    <div className="text-sm">Bloated feature set</div>
                  </div>
                </div>
              </div>

              {/* Right: Niche (Vibrant) */}
              <div className="border-2 border-indigo-500 p-6 bg-[#111] relative shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                <div className="absolute -top-3 left-6 px-3 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest">
                  Easy Mode (Niche)
                </div>
                <div className="space-y-6 mt-4">
                  <div>
                    <div className="text-[10px] text-indigo-400 uppercase font-bold">
                      Audience
                    </div>
                    <div className="text-sm font-medium">
                      Hyper-specific segment (e.g. Solo Dentists)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-400 uppercase font-bold">
                      Price
                    </div>
                    <div className="text-sm font-medium">
                      Premium value pricing ($299/mo)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-400 uppercase font-bold">
                      GTM
                    </div>
                    <div className="text-sm font-medium">
                      Direct Outreach / Specific Community
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-400 uppercase font-bold">
                      Scope
                    </div>
                    <div className="text-sm font-medium">
                      1 Core Workflow executed perfectly
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button
                    onClick={onPivot}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  >
                    <Zap size={18} className="fill-current" />
                    Pivot to Niche (1 Credit)
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
