import React, { useState } from "react";
import { Lock, Check, X, RefreshCw } from "lucide-react";

export function NodeGraphPipeline({ isLocked }: { isLocked: boolean }) {
  const [masteryState, setMasteryState] = useState<"NOVICE" | "MASTER">(
    "NOVICE",
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050505] p-6 text-white font-mono">
      <div
        data-testid="node-graph-container"
        className={`flex-1 transition-all duration-500 flex flex-col gap-6 ${isLocked ? "blur-sm grayscale opacity-50" : ""}`}
      >
        {masteryState === "NOVICE" && (
          <div className="border-2 border-dashed border-white/20 p-4 rounded-xl text-white/50 text-sm">
            The AI breaks features into atomic phases and pauses. Nothing is
            coded until you approve.
          </div>
        )}

        {/* Active Node */}
        <div className="border-2 border-[#E3FF00] p-6 rounded-xl bg-white/5 shadow-[0_0_15px_rgba(227,255,0,0.2)] animate-pulse-border">
          <h3 className="font-sans font-bold text-xl mb-4 text-[#E3FF00]">
            Phase 01: Database Schema
          </h3>
          <pre className="text-xs text-white/70 bg-black/50 p-4 rounded overflow-x-auto border border-white/10">
            {`model User {
  id    String @id @default(cuid())
  email String @unique
}`}
          </pre>

          <div className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              placeholder="See an issue? Ask the AI to revise this schema..."
              className="w-full bg-black/50 border border-white/20 rounded p-3 text-sm text-white focus:border-[#E3FF00] outline-none"
              disabled={isLocked}
            />
            <div className="flex gap-3 justify-end">
              <button
                disabled={isLocked}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded hover:bg-white/10 transition-colors text-white"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button
                disabled={isLocked}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded hover:bg-white/10 transition-colors text-white"
              >
                <RefreshCw className="w-4 h-4" /> Revise
              </button>
              <button
                disabled={isLocked}
                onClick={() => setMasteryState("MASTER")}
                className="flex items-center gap-2 px-6 py-2 bg-[#E3FF00] text-black font-bold rounded hover:bg-[#d4ee00] transition-colors"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
            </div>
          </div>
        </div>

        {/* Locked Future Node */}
        <div className="border border-white/10 p-6 rounded-xl bg-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="flex flex-col items-center text-white/50">
              <Lock className="w-6 h-6 mb-2" />
              <span className="text-xs text-center px-8">
                Locked. The AI will draft these routes after you approve the
                Database Schema in Phase 02.
              </span>
            </div>
          </div>
          <h3 className="font-sans font-bold text-xl mb-4 text-white/30">
            Phase 02: API Routes
          </h3>
          <div className="h-24 bg-white/5 rounded border border-white/10"></div>
        </div>
      </div>

      {isLocked && (
        <div
          data-testid="lock-overlay"
          className="absolute inset-0 z-50 flex items-center justify-center"
        >
          <div className="bg-black/80 backdrop-blur p-6 rounded-2xl flex flex-col items-center border border-white/10 shadow-2xl">
            <Lock className="w-12 h-12 text-[#E3FF00] mb-4" />
            <h2 className="text-2xl font-bold font-sans text-white mb-2">
              Vault Locked
            </h2>
            <p className="text-white/70 max-w-sm text-center text-sm">
              Sign in to unlock the Director execution phase and save your
              strategy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
