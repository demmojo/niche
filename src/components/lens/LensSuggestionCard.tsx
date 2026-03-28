import React, { useState } from "react";
import { LensSuggestion } from "../../types";

interface LensSuggestionCardProps {
  suggestion: LensSuggestion;
  onApprove: (suggestion: LensSuggestion) => void;
  onDismiss: (suggestion: LensSuggestion, reason: string) => void;
}

const REJECTION_REASONS = [
  "OUT OF SCOPE",
  "TOO HORIZONTAL",
  "LOW ROI",
  "INACCURATE",
];

/**
 *
 */
export function LensSuggestionCard({
  suggestion,
  onApprove,
  onDismiss,
}: LensSuggestionCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  // Determine confidence segments
  const CONFIDENCE_SCORES: Record<LensSuggestion["confidence"], number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };
  const confScore = CONFIDENCE_SCORES[suggestion.confidence];

  if (isDismissing) {
    return (
      <div className="flex w-full animate-in slide-in-from-right-2 fade-in items-center justify-between bg-obsidian border-t border-ink-dark/30 p-3 mt-4 text-white">
        <span className="font-mono text-xs text-ink-muted">
          REASON FOR DISMISSAL?
        </span>
        <div className="flex gap-2">
          {REJECTION_REASONS.map((reason) => (
            <button
              key={reason}
              className="border border-ink-dark bg-transparent px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted transition-colors hover:border-radical-red hover:text-radical-red hover:bg-radical-red/10 focus:outline-none"
              onClick={() => onDismiss(suggestion, reason)}
            >
              {reason}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-4 flex flex-col overflow-hidden border border-ink-dark/30 bg-[#08090C] text-ink-light shadow-lg transition-all hover:border-electric-cyan/30 w-full text-left">
      {/* Header & Description */}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold tracking-wide text-white">
          {suggestion.title}
        </h3>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
          {suggestion.description}
        </p>
      </div>

      {/* Context Panel: Rationale & Confidence */}
      <div className="flex flex-col gap-2 border-l-2 border-electric-cyan/40 bg-obsidian-light p-3 pl-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs font-semibold text-electric-cyan">
              ↳ RATIONALE
            </span>
            <span className="font-mono text-xs text-ink-muted max-w-2xl">
              {suggestion.rationale}
            </span>
          </div>

          {/* Semantic Confidence Badge */}
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 w-12 gap-0.5">
              <div
                className={`h-full flex-1 ${confScore >= 1 ? "bg-electric-cyan shadow-[0_0_8px_rgba(0,229,255,0.4)]" : "bg-ink-dark/30"}`}
              ></div>
              <div
                className={`h-full flex-1 ${confScore >= 2 ? "bg-electric-cyan shadow-[0_0_8px_rgba(0,229,255,0.4)]" : "bg-ink-dark/30"}`}
              ></div>
              <div
                className={`h-full flex-1 ${confScore >= 3 ? "bg-electric-cyan shadow-[0_0_8px_rgba(0,229,255,0.4)]" : "bg-ink-dark/30"}`}
              ></div>
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-electric-cyan uppercase">
              {suggestion.confidence} CONF
            </span>
          </div>
        </div>

        {/* Provenance Tags */}
        <div className="flex gap-2 font-mono text-[10px]">
          <span className="border border-ink-dark px-1.5 py-0.5 text-ink-muted">
            SRC: SYSTEM
          </span>
          <span className="border border-ink-dark px-1.5 py-0.5 text-ink-muted">
            TYPE: {suggestion.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 border-t border-ink-dark/30 bg-[#08090C] p-3">
        <button
          className="group flex items-center gap-2 px-4 py-1.5 font-mono text-xs font-medium text-ink-muted transition-all hover:text-radical-red"
          onClick={() => setIsDismissing(true)}
        >
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            [
          </span>
          DISMISS
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            ]
          </span>
        </button>

        <button
          className="flex items-center gap-2 border border-electric-cyan bg-electric-cyan/10 px-5 py-1.5 font-mono text-xs font-bold text-electric-cyan transition-all hover:bg-electric-cyan hover:text-[#08090C] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]"
          onClick={() => onApprove(suggestion)}
        >
          <span className="text-[10px] opacity-70">EXE //</span>
          APPROVE & ADD
        </button>
      </div>
    </div>
  );
}
