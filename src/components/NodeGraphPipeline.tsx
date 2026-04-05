import React, { useState } from "react";
import { Lock, Check, X, RefreshCw } from "lucide-react";

enum PipelineState {
  NOVICE,
  MASTER,
  REJECTED,
  COMPLETED,
}

enum Phase {
  SCHEMA = 1,
  API = 2,
}

export function NodeGraphPipeline({ isLocked }: { isLocked: boolean }) {
  const [pipelineState, setPipelineState] = useState<PipelineState>(
    PipelineState.NOVICE,
  );
  const [activePhase, setActivePhase] = useState<Phase>(Phase.SCHEMA);
  const [revisionText, setRevisionText] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleRevise = () => {
    setIsRevising(true);
    // Simulate API call for revision
    setTimeout(() => {
      setIsRevising(false);
      setRevisionText("");
    }, 1500);
  };

  const handleApprovePhase1 = () => {
    setPipelineState(PipelineState.MASTER);
    setActivePhase(Phase.API);
    setIsDrafting(true);

    // Simulate drafting Phase 2
    setTimeout(() => {
      setIsDrafting(false);
      setPipelineState(PipelineState.COMPLETED);
    }, 2000);
  };

  const handleReject = () => {
    setPipelineState(PipelineState.REJECTED);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F5F3ED] p-6 text-ink-dark font-sans">
      <div
        data-testid="node-graph-container"
        inert={isLocked || undefined}
        className={`flex-1 transition-all duration-500 flex flex-col gap-6 ${
          isLocked
            ? "blur-sm grayscale opacity-50 select-none pointer-events-none"
            : ""
        }`}
      >
        {pipelineState === PipelineState.NOVICE && (
          <div className="border border-dashed border-ink-dark/20 p-4 rounded-xl text-ink-dark/70 text-sm font-medium">
            The AI breaks features into atomic phases and pauses. Nothing is
            coded until you approve.
          </div>
        )}

        {pipelineState === PipelineState.REJECTED && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-sm font-medium flex justify-between items-center">
            <span>Pipeline rejected and halted.</span>
            <button
              onClick={() => setPipelineState(PipelineState.NOVICE)}
              className="text-rose-900 hover:underline font-bold"
            >
              Restart
            </button>
          </div>
        )}

        {/* Phase 01 */}
        <div
          className={`border-2 p-6 rounded-xl shadow-sm transition-all duration-300 ${
            activePhase === Phase.SCHEMA &&
            pipelineState !== PipelineState.REJECTED
              ? "border-ink-dark bg-white"
              : "border-slate-200 bg-white/50 opacity-60"
          }`}
        >
          <h3 className="font-serif font-bold text-xl mb-4 text-ink-dark flex items-center justify-between">
            Phase 01: Database Schema
            {activePhase > Phase.SCHEMA && (
              <span className="text-sm font-sans bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <Check className="w-4 h-4 inline mr-1" />
                Approved
              </span>
            )}
          </h3>
          <pre className="text-xs text-ink-dark/80 bg-slate-50 p-4 rounded overflow-x-auto border border-slate-200 font-mono">
            {`model User {
  id    String @id @default(cuid())
  email String @unique
}`}
          </pre>

          {activePhase === Phase.SCHEMA &&
            pipelineState !== PipelineState.REJECTED && (
              <div className="mt-6 flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="See an issue? Ask the AI to revise this schema..."
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-sm text-ink-dark focus:border-ink-dark outline-none transition-colors"
                  disabled={isRevising}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleReject}
                    disabled={isRevising}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors text-ink-dark/70 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    disabled={!revisionText || isRevising}
                    onClick={handleRevise}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded hover:bg-slate-100 transition-colors text-ink-dark/70 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRevising ? "animate-spin" : ""}`}
                    />
                    {isRevising ? "Revising..." : "Revise"}
                  </button>
                  <button
                    disabled={isRevising}
                    onClick={handleApprovePhase1}
                    className="flex items-center gap-2 px-6 py-2 bg-ink-dark text-white font-bold rounded hover:bg-black transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Phase 02 */}
        <div
          className={`border p-6 rounded-xl relative overflow-hidden transition-all duration-300 ${
            activePhase === Phase.API &&
            pipelineState !== PipelineState.REJECTED
              ? "border-ink-dark bg-white shadow-sm"
              : "border-slate-200 bg-white/50"
          }`}
        >
          {activePhase === Phase.SCHEMA &&
            pipelineState !== PipelineState.REJECTED && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center text-ink-dark/60">
                  <Lock className="w-6 h-6 mb-2" />
                  <span className="text-xs text-center px-8 font-medium">
                    Locked. The AI will draft these routes after you approve the
                    Database Schema in Phase 01.
                  </span>
                </div>
              </div>
            )}
          <h3 className="font-serif font-bold text-xl mb-4 text-ink-dark/80 flex items-center justify-between">
            Phase 02: API Routes
            {pipelineState === PipelineState.COMPLETED && (
              <span className="text-sm font-sans bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <Check className="w-4 h-4 inline mr-1" />
                Completed
              </span>
            )}
          </h3>

          {pipelineState === PipelineState.REJECTED ? (
            <div className="h-24 bg-slate-50 rounded border border-slate-200 opacity-50"></div>
          ) : activePhase === Phase.SCHEMA ? (
            <div className="h-24 bg-slate-50 rounded border border-slate-200"></div>
          ) : isDrafting ? (
            <div className="text-sm text-ink-dark/70 leading-relaxed italic animate-pulse flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Drafting API routes...
            </div>
          ) : (
            <pre className="text-xs text-ink-dark/80 bg-slate-50 p-4 rounded overflow-x-auto border border-slate-200 font-mono">
              {`// Generated API Routes
export const GET = async (req: Request) => {
  const users = await db.user.findMany();
  return Response.json(users);
}`}
            </pre>
          )}
        </div>
      </div>

      {isLocked && (
        <div
          data-testid="lock-overlay"
          className="absolute inset-0 z-50 flex items-center justify-center"
        >
          <div className="bg-white/90 backdrop-blur p-8 rounded-2xl flex flex-col items-center border border-slate-200 shadow-xl max-w-sm text-center">
            <Lock className="w-12 h-12 text-ink-dark mb-4" />
            <h2 className="text-2xl font-bold font-serif text-ink-dark mb-2">
              Vault Locked
            </h2>
            <p className="text-ink-dark/70 text-sm leading-relaxed">
              Sign in to unlock the Director execution phase and save your
              strategy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
