import React, { useState, useEffect } from "react";
import {
  Bot,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

interface AgentStep {
  id: string;
  agentName: string;
  role: "PM Synthesis" | "Architect Translation" | "Critic Alignment";
  status: "pending" | "in-progress" | "completed" | "failed";
  actionText: string;
  resultText?: string;
  filesGenerated?: string[];
}

interface ArtifactGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: any;
}

export const ArtifactGenerationModal: React.FC<
  ArtifactGenerationModalProps
> = ({ isOpen, onClose, contextData }) => {
  const [steps, setSteps] = useState<AgentStep[]>([
    {
      id: "step1",
      agentName: "Agent PM",
      role: "PM Synthesis",
      status: "pending",
      actionText:
        "Drafting high-level requirements and value proposition based on external signals...",
    },
    {
      id: "step2",
      agentName: "Agent Architect",
      role: "Architect Translation",
      status: "pending",
      actionText:
        "Translating requirements into system design and actionable development tasks...",
    },
    {
      id: "step3",
      agentName: "Agent Critic",
      role: "Critic Alignment",
      status: "pending",
      actionText:
        "Evaluating proposed features against the entire product knowledge graph to prevent hallucinations...",
    },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setCurrentStepIndex(-1);
      setIsComplete(false);
      setSteps(
        steps.map((s) => ({
          ...s,
          status: "pending",
          resultText: undefined,
          filesGenerated: undefined,
        })),
      );
      return;
    }

    // Start simulation
    setCurrentStepIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      // Mark current as in-progress
      setSteps((prev) =>
        prev.map((s, i) =>
          i === currentStepIndex ? { ...s, status: "in-progress" } : s,
        ),
      );

      const timer = setTimeout(() => {
        // Mark current as completed and set result
        setSteps((prev) =>
          prev.map((s, i) => {
            if (i === currentStepIndex) {
              let resultText = "";
              let filesGenerated: string[] = [];

              if (s.role === "PM Synthesis") {
                resultText =
                  "Successfully synthesized user jobs and generated a core proposal.";
                filesGenerated = ["proposal.md"];
              } else if (s.role === "Architect Translation") {
                resultText =
                  "Created technical design and broke down feature into 2 development phases.";
                filesGenerated = ["design.md", "tasks.md"];
              } else if (s.role === "Critic Alignment") {
                resultText =
                  "No hallucinations detected. Feature aligns with current architectural constraints and market data. Approved for code generation.";
              }

              return { ...s, status: "completed", resultText, filesGenerated };
            }
            return s;
          }),
        );

        setCurrentStepIndex((prev) => prev + 1);
      }, 2500); // Simulate network latency/LLM generation

      return () => clearTimeout(timer);
    } else if (currentStepIndex === steps.length) {
      setIsComplete(true);
    }
  }, [currentStepIndex, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-ink-dark/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky/10 text-sky rounded-lg">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-ink-dark">
                Multi-Agent Debate Theater
              </h2>
              <p className="text-xs text-ink-dark/60">
                Artifact Generation Engine (OpenSpec)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-paper-base rounded-full transition-colors text-ink-dark/60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-paper-base/50">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-5 rounded-xl border transition-all duration-300 ${
                step.status === "in-progress"
                  ? "bg-white border-sky/30 shadow-md ring-1 ring-sky/10"
                  : step.status === "completed"
                    ? "bg-white border-emerald-200"
                    : "bg-white/50 border-ink-dark/10 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 shrink-0 ${
                    step.status === "in-progress"
                      ? "text-sky animate-pulse"
                      : step.status === "completed"
                        ? "text-emerald-500"
                        : "text-ink-dark/30"
                  }`}
                >
                  {step.status === "in-progress" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : step.status === "completed" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Clock size={20} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-ink-dark text-sm">
                      {step.role}
                    </h4>
                    <span className="text-[10px] font-mono bg-ink-dark/5 px-2 py-0.5 rounded text-ink-dark/60">
                      {step.agentName}
                    </span>
                  </div>

                  <p className="text-sm text-ink-dark/70 mb-2">
                    {step.status === "pending" ? "Waiting..." : step.actionText}
                  </p>

                  {step.status === "completed" && step.resultText && (
                    <div className="mt-3 pt-3 border-t border-ink-dark/5">
                      <p className="text-sm text-ink-dark font-medium flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">↳</span>
                        {step.resultText}
                      </p>

                      {step.filesGenerated &&
                        step.filesGenerated.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {step.filesGenerated.map((file) => (
                              <div
                                key={file}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-paper-base border border-ink-dark/10 rounded-md text-xs font-mono text-ink-dark/80"
                              >
                                <FileText size={12} className="text-sky" />
                                {file}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isComplete && (
            <div className="p-5 bg-sky/5 border border-sky/20 rounded-xl animate-in slide-in-from-bottom-4 fade-in duration-500">
              <h4 className="font-bold text-sky mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                OpenSpec Generation Complete
              </h4>
              <p className="text-sm text-ink-dark/80 mb-4">
                The agents have successfully debated and generated the
                foundational product requirements. The files are ready in your
                workspace.
              </p>

              <div className="bg-ink-dark text-white p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                <span className="text-emerald-400">
                  # Optimized CodeGen Prompt Ready
                </span>
                <br />
                <span className="text-white/60">
                  A new OpenSpec has been approved at{" "}
                </span>
                <span className="text-sky-300">
                  openspec/changes/strategy-toolbox
                </span>
                <span className="text-white/60">. Please execute the </span>
                <span className="text-amber-300">apply-openspec</span>
                <span className="text-white/60">
                  {" "}
                  skill to generate the implementation.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-ink-dark/10 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-paper-base text-ink-dark border border-ink-dark/20 rounded-lg hover:bg-ink-dark/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            disabled={!isComplete}
            onClick={() => {
              onClose();
              // Trigger copilot/canvas action natively in the app
            }}
            className="px-4 py-2 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Copy Prompt & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
