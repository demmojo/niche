import React, { useState, useEffect } from "react";
import { Lock, Check, X, RefreshCw, GitCommit, GitMerge } from "lucide-react";

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

const INITIAL_SCHEMA = `model User {
  id    String @id @default(cuid())
  email String @unique
}`;

const REVISED_SCHEMA = `model User {
  id    String @id @default(cuid())
  email String @unique
  role  String @default("USER")
  stripeId String? @unique
}`;

const DRAFT_LOGS = [
  "Analyzing schema relationships...",
  "Generating CRUD routes...",
  "Validating types and constraints...",
  "Optimizing query boundaries...",
];

export function NodeGraphPipeline({ isLocked }: { isLocked: boolean }) {
  const [pipelineState, setPipelineState] = useState<PipelineState>(
    PipelineState.NOVICE,
  );
  const [activePhase, setActivePhase] = useState<Phase>(Phase.SCHEMA);
  const [revisionText, setRevisionText] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Phase 01: Versioning and Diff state
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const currentSchema = schemaVersion === 0 ? INITIAL_SCHEMA : REVISED_SCHEMA;

  // Phase 02: Staggered Logs state
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isDrafting) {
      setCurrentLogIndex(0);
      interval = setInterval(() => {
        setCurrentLogIndex((prev) => Math.min(prev + 1, DRAFT_LOGS.length - 1));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isDrafting]);

  const handleRevise = () => {
    setIsRevising(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsRevising(false);
      setSchemaVersion(1);
      setShowDiff(true);
      setRevisionText("");
    }, 2000);
  };

  const handleApprovePhase1 = () => {
    setPipelineState(PipelineState.MASTER);
    setActivePhase(Phase.API);
    setIsDrafting(true);

    // Simulate drafting Phase 2
    setTimeout(() => {
      setIsDrafting(false);
      setPipelineState(PipelineState.COMPLETED);
    }, 2500);
  };

  const handleReject = () => {
    setPipelineState(PipelineState.REJECTED);
  };

  // Very naive diff renderer for our hardcoded mock
  const renderDiff = () => {
    const oldLines = INITIAL_SCHEMA.split("\n");
    const newLines = REVISED_SCHEMA.split("\n");

    return (
      <div className="font-mono text-xs flex flex-col">
        {newLines.map((line, index) => {
          const isNew = !oldLines.includes(line);
          if (isNew) {
            return (
              <div
                key={index}
                className="bg-green-100 text-green-900 px-2 py-0.5 border-l-2 border-green-500 flex gap-2"
              >
                <span className="opacity-50 select-none">+</span>
                <span>{line}</span>
              </div>
            );
          }
          return (
            <div
              key={index}
              className="px-2 py-0.5 text-ink-dark/70 flex gap-2"
            >
              <span className="opacity-0 select-none">+</span>
              <span>{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F5F3ED] p-6 text-ink-dark font-sans">
      <div
        data-testid="node-graph-container"
        inert={isLocked || undefined}
        className={`flex-1 transition-all duration-500 flex flex-col gap-6 ${
          isLocked
            ? "blur-md grayscale opacity-40 select-none pointer-events-none"
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
              onClick={() => {
                setPipelineState(PipelineState.NOVICE);
                setSchemaVersion(0);
                setShowDiff(false);
              }}
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

          <div className="relative mb-2">
            <div
              className={`text-xs text-ink-dark/80 bg-slate-50 p-4 rounded overflow-x-auto border border-slate-200 font-mono transition-all duration-500 ${
                isRevising ? "opacity-30 blur-[2px]" : ""
              }`}
            >
              {showDiff ? renderDiff() : currentSchema}
            </div>

            {/* Contextualize AI Generation - Shimmer overlay */}
            {isRevising && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded bg-slate-100/30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/40 to-transparent w-[200%] animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                <div className="bg-ink-dark text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 relative z-10 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Streaming AI revisions...
                </div>
              </div>
            )}
          </div>

          {/* Diff / Versioning UI mechanism */}
          {schemaVersion > 0 && !isRevising && (
            <div className="flex items-center justify-between mt-2 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-ink-dark/60 bg-slate-100 px-2 py-1 rounded">
                <GitCommit className="w-3 h-3" />
                <span>v{schemaVersion + 1}.0</span>
              </div>
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={`text-xs font-medium flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  showDiff
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <GitMerge className="w-3 h-3" />
                {showDiff ? "Hide Changes" : "Compare Versions"}
              </button>
            </div>
          )}

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
          className={`border p-6 rounded-xl relative overflow-hidden transition-all duration-300 flex-1 ${
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
            <div className="h-32 bg-slate-50 rounded border border-slate-200 opacity-50"></div>
          ) : activePhase === Phase.SCHEMA ? (
            <div className="h-32 bg-slate-50 rounded border border-slate-200"></div>
          ) : isDrafting ? (
            <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs text-emerald-400 border border-slate-800 shadow-inner flex flex-col gap-2 h-40 overflow-hidden relative">
              {DRAFT_LOGS.slice(0, currentLogIndex + 1).map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 animate-[fadeIn_0.3s_ease-out_forwards]"
                >
                  <span className="text-emerald-700 select-none mt-0.5">
                    {">"}
                  </span>
                  <span className="leading-relaxed">{log}</span>
                </div>
              ))}
              {currentLogIndex < DRAFT_LOGS.length && (
                <div className="w-2 h-3.5 bg-emerald-400 animate-pulse mt-1 ml-4"></div>
              )}
            </div>
          ) : (
            <pre className="text-xs text-ink-dark/80 bg-slate-50 p-4 rounded overflow-x-auto border border-slate-200 font-mono h-40">
              {`// Generated API Routes
export const GET = async (req: Request) => {
  const users = await db.user.findMany();
  return Response.json(users);
}

export const POST = async (req: Request) => {
  // AI scaffolding...
}`}
            </pre>
          )}
        </div>
      </div>

      {isLocked && (
        <div
          data-testid="lock-overlay"
          className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#F5F3ED]/40 backdrop-blur-[6px]"
        >
          {/* Blurred Architecture Map Background */}
          <div className="absolute inset-0 opacity-30 pointer-events-none scale-110 blur-[3px]">
            <div className="absolute top-1/4 left-1/4 w-32 h-20 border-2 border-ink-dark/60 rounded-xl"></div>
            <div className="absolute top-1/3 left-1/2 w-48 h-32 border-2 border-ink-dark/60 rounded-xl"></div>
            <div className="absolute bottom-1/4 right-1/3 w-24 h-24 border-2 border-ink-dark/60 rounded-full"></div>
            <div className="absolute top-2/3 left-1/4 w-16 h-16 border-2 border-ink-dark/60 rounded-lg rotate-45"></div>
            <svg className="absolute inset-0 w-full h-full text-ink-dark/40">
              <path
                d="M 25% 25% L 50% 33%"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              <path
                d="M 50% 33% L 75% 75%"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              <path
                d="M 25% 66% L 50% 33%"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
          </div>

          <div className="relative bg-white/95 backdrop-blur-xl p-10 rounded-2xl flex flex-col items-center border border-slate-200 shadow-2xl max-w-md text-center z-10 transform transition-transform hover:scale-[1.02]">
            <div className="w-16 h-16 bg-ink-dark rounded-2xl flex items-center justify-center mb-6 shadow-inner rotate-3">
              <Lock className="w-8 h-8 text-white -rotate-3" />
            </div>
            <h2 className="text-3xl font-bold font-serif text-ink-dark mb-4 tracking-tight">
              Architecture Locked
            </h2>
            <p className="text-ink-dark/80 text-base leading-relaxed mb-8">
              Save your validated schema to unlock the Director execution phase.
              The AI is ready to generate and deploy your backend routes.
            </p>
            <button className="bg-ink-dark text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-black transition-colors w-full flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Unlock Director Phase
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
