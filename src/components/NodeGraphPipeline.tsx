import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  Lock,
  Check,
  X,
  RefreshCw,
  GitCommit,
  GitMerge,
  Code,
  LayoutList,
  ArrowRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useIsMounted } from "../hooks/useIsMounted";

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
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const [isRevising, startReviseTransition] = useTransition();
  const [isDrafting, startDraftTransition] = useTransition();

  const isMounted = useIsMounted();

  // Phase 01: Versioning and Diff state
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState<string[]>([]);
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
    startReviseTransition(async () => {
      // Simulate AI generation
      await new Promise((res) => setTimeout(res, 2000));
      if (!isMounted.current) return;
      setSchemaVersion(1);
      setShowDiff(true);
      if (revisionText) {
        setRevisionHistory((prev) => [...prev, revisionText]);
      }
      setRevisionText("");
    });
  };

  const handleApprovePhase1 = () => {
    setPipelineState(PipelineState.MASTER);
    setActivePhase(Phase.API);

    startDraftTransition(async () => {
      // Simulate drafting Phase 2
      await new Promise((res) => setTimeout(res, 2500));
      if (!isMounted.current) return;
      setPipelineState(PipelineState.COMPLETED);
    });
  };

  const handleReject = () => {
    setPipelineState(PipelineState.REJECTED);
  };

  // Very naive diff renderer for our hardcoded mock
  const diffLines = useMemo(() => {
    const oldLines = new Set(INITIAL_SCHEMA.split("\n"));
    const newLines = REVISED_SCHEMA.split("\n");
    return newLines.map((line) => ({
      line,
      isNew: !oldLines.has(line),
    }));
  }, []);

  const renderDiff = () => {
    return (
      <div className="font-mono text-xs flex flex-col">
        {diffLines.map((diff, index) => {
          if (diff.isNew) {
            return (
              <div
                key={index}
                className="bg-green-100 text-green-900 px-2 py-0.5 border-l-2 border-green-500 flex gap-2"
              >
                <span className="opacity-50 select-none">+</span>
                <span>{diff.line}</span>
              </div>
            );
          }
          return (
            <div
              key={index}
              className="px-2 py-0.5 text-ink-dark/70 flex gap-2"
            >
              <span className="opacity-0 select-none">+</span>
              <span>{diff.line}</span>
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
        className={cn("flex-1 transition-all duration-500 flex flex-col gap-6")}
      >
        {pipelineState === PipelineState.NOVICE && (
          <div className="border border-dashed border-ink-dark/20 p-4 rounded-xl text-ink-dark/70 text-sm font-medium">
            The AI breaks features into atomic phases and pauses. Nothing is
            coded until you approve.
          </div>
        )}

        {/* Phase 01 */}
        <div
          className={cn(
            "border-2 p-6 rounded-xl shadow-sm transition-all duration-300",
            activePhase === Phase.SCHEMA &&
              pipelineState !== PipelineState.REJECTED
              ? "border-ink-dark bg-white"
              : "border-slate-200 bg-white/50 opacity-60",
            pipelineState === PipelineState.REJECTED &&
              "border-rose-200 bg-rose-50/50 opacity-80",
          )}
        >
          <h3 className="font-serif font-bold text-xl mb-4 text-ink-dark flex items-center justify-between">
            <span className="flex items-center gap-3">
              Phase 01: Data Model
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-sans">
                <button
                  onClick={() => setIsDeveloperMode(false)}
                  aria-pressed={!isDeveloperMode}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                    !isDeveloperMode
                      ? "bg-white text-ink-dark shadow-sm"
                      : "text-ink-dark/50 hover:text-ink-dark",
                  )}
                >
                  <LayoutList className="w-3 h-3" /> Visual
                </button>
                <button
                  onClick={() => setIsDeveloperMode(true)}
                  aria-pressed={isDeveloperMode}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                    isDeveloperMode
                      ? "bg-white text-ink-dark shadow-sm"
                      : "text-ink-dark/50 hover:text-ink-dark",
                  )}
                >
                  <Code className="w-3 h-3" /> Code
                </button>
              </div>
            </span>
            {activePhase > Phase.SCHEMA && (
              <span className="text-sm font-sans bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <Check className="w-4 h-4 inline mr-1" />
                Approved
              </span>
            )}
          </h3>

          <div className="relative mb-2">
            <div
              className={cn(
                "text-xs text-ink-dark/80 bg-slate-50 p-4 rounded overflow-x-auto border border-slate-200 transition-all duration-500",
                isDeveloperMode ? "font-mono" : "font-sans",
                isRevising && "opacity-30 blur-[2px]",
              )}
            >
              {isDeveloperMode ? (
                showDiff ? (
                  renderDiff()
                ) : (
                  currentSchema
                )
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="font-bold text-sm mb-1">
                    User Profile Entity
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">
                      id (System ID)
                    </span>
                    <span className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">
                      email (Unique Login)
                    </span>
                    {(schemaVersion > 0 || showDiff) && (
                      <>
                        <span className="px-2 py-1 bg-green-50 text-green-800 border border-green-200 rounded shadow-sm">
                          role (User Tier Access)
                        </span>
                        <span className="px-2 py-1 bg-green-50 text-green-800 border border-green-200 rounded shadow-sm">
                          stripeId (SaaS Billing Required)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contextualize AI Generation - Shimmer overlay */}
            {isRevising && (
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded bg-slate-100/30"
                aria-live="polite"
                aria-atomic="true"
                aria-busy="true"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/40 to-transparent w-[200%] animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                <div className="bg-ink-dark text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 relative z-10 animate-pulse">
                  <RefreshCw
                    className="w-3 h-3 animate-spin"
                    aria-hidden="true"
                  />
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
          pipelineState !== PipelineState.REJECTED ? (
            <div className="mt-6 flex flex-col gap-4">
              {revisionHistory.length > 0 && (
                <div className="flex flex-col gap-2 mb-2">
                  {revisionHistory.map((historyItem, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded p-3 text-sm text-ink-dark/80 italic flex gap-2"
                    >
                      <span className="font-bold text-ink-dark not-italic">
                        You:
                      </span>{" "}
                      "{historyItem}"
                    </div>
                  ))}
                </div>
              )}
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
          ) : (
            pipelineState === PipelineState.REJECTED && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setPipelineState(PipelineState.NOVICE);
                    setSchemaVersion(0);
                    setShowDiff(false);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white font-bold rounded hover:bg-rose-700 transition-colors w-full"
                >
                  <RefreshCw className="w-4 h-4" /> Restart Generation
                </button>
              </div>
            )
          )}
        </div>

        {/* Phase 02 */}
        <div
          inert={isLocked && activePhase === Phase.API}
          className={cn(
            "border p-6 rounded-xl relative overflow-hidden transition-all duration-300 flex-1",
            activePhase === Phase.API &&
              pipelineState !== PipelineState.REJECTED
              ? "border-ink-dark bg-white shadow-sm"
              : "border-slate-200 bg-white/50",
            isLocked &&
              activePhase === Phase.API &&
              "blur-sm grayscale opacity-60 select-none pointer-events-none",
          )}
        >
          {activePhase === Phase.SCHEMA &&
            pipelineState !== PipelineState.REJECTED && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center text-ink-dark/60">
                  <Lock className="w-6 h-6 mb-2" />
                  <span className="text-xs text-center px-8 font-medium">
                    Locked. The AI will draft these routes after you approve the
                    Data Model in Phase 01.
                  </span>
                </div>
              </div>
            )}
          <h3 className="font-serif font-bold text-xl mb-4 text-ink-dark/80 flex items-center justify-between">
            Phase 02: Execution Logic
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
            <div
              className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs text-emerald-400 border border-slate-800 shadow-inner flex flex-col gap-2 h-40 overflow-hidden relative"
              aria-live="polite"
              aria-relevant="additions"
            >
              {DRAFT_LOGS.slice(0, currentLogIndex + 1).map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 animate-[fadeIn_0.3s_ease-out_forwards]"
                >
                  <span
                    className="text-emerald-700 select-none mt-0.5"
                    aria-hidden="true"
                  >
                    {">"}
                  </span>
                  <span className="leading-relaxed">{log}</span>
                </div>
              ))}
              {currentLogIndex < DRAFT_LOGS.length && (
                <div
                  className="w-2 h-3.5 bg-emerald-400 animate-pulse mt-1 ml-4"
                  aria-hidden="true"
                ></div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <pre className="text-xs text-ink-dark/80 bg-slate-50 p-4 rounded overflow-x-auto border border-slate-200 font-mono h-40">
                {`// Generated Execution Logic
export const GET = async (req: Request) => {
  const users = await db.user.findMany();
  return Response.json(users);
}

export const POST = async (req: Request) => {
  // AI scaffolding...
}`}
              </pre>
              {pipelineState === PipelineState.COMPLETED && (
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-ink-dark text-white font-bold rounded-lg hover:bg-black transition-colors w-full mt-2">
                  Proceed to Workspace <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isLocked &&
        pipelineState !== PipelineState.NOVICE &&
        activePhase === Phase.API && (
          <div
            data-testid="lock-overlay"
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#F5F3ED]/40 backdrop-blur-[6px]"
          >
            <div className="relative bg-white/95 backdrop-blur-xl p-10 rounded-2xl flex flex-col items-center border border-slate-200 shadow-xl max-w-md text-center z-10 transition-transform">
              <div className="w-16 h-16 bg-ink-dark rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-serif text-ink-dark mb-4 tracking-tight">
                Architecture Locked
              </h2>
              <p className="text-ink-dark/80 text-base leading-relaxed mb-8">
                Save your validated schema to unlock the Director execution
                phase. The AI is ready to generate and deploy your backend
                routes.
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
