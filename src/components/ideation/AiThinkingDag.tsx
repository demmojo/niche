import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Network,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface AiThinkingDagProps {
  jobId: string;
  competitorsCount: number;
  onComplete: (features: any[]) => void;
}

type NodeStatus = "pending" | "processing" | "success" | "failed";

interface DagNode {
  id: string;
  label: string;
  status: NodeStatus;
  progress: number;
  error?: string;
}

export const AiThinkingDag: React.FC<AiThinkingDagProps> = ({
  jobId,
  competitorsCount,
  onComplete,
}) => {
  const [nodes, setNodes] = useState<DagNode[]>([
    {
      id: "network-io",
      label: "Ingesting Competitors",
      status: "pending",
      progress: 0,
    },
    {
      id: "vision-ml",
      label: "Extracting Visual Features",
      status: "pending",
      progress: 0,
    },
    {
      id: "synthesize",
      label: "Synthesizing Hybrid Product",
      status: "pending",
      progress: 0,
    },
  ]);

  useEffect(() => {
    // 1. Establish SSE Connection
    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = (event) => {
      // Handles native unnamed events if any
    };

    eventSource.addEventListener("progress", (e: any) => {
      const data = JSON.parse(e.data);
      console.log("SSE Progress:", data);

      // Map job ID to node ID
      let targetNodeId = "synthesize";
      if (data.jobId?.includes("scrape")) targetNodeId = "network-io";
      else if (data.jobId?.includes("vision")) targetNodeId = "vision-ml";

      setNodes((prev) =>
        prev.map((n) =>
          n.id === targetNodeId
            ? { ...n, status: "processing", progress: data.progress }
            : n,
        ),
      );
    });

    eventSource.addEventListener("completed", (e: any) => {
      const data = JSON.parse(e.data);

      let targetNodeId = "synthesize";
      if (data.jobId?.includes("scrape")) targetNodeId = "network-io";
      else if (data.jobId?.includes("vision")) targetNodeId = "vision-ml";

      setNodes((prev) =>
        prev.map((n) =>
          n.id === targetNodeId
            ? { ...n, status: "success", progress: 100 }
            : n,
        ),
      );

      // Mock advancing to the next stage if network-io is done
      if (targetNodeId === "network-io") {
        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === "vision-ml"
                ? { ...n, status: "processing", progress: 50 }
                : n,
            ),
          );

          setTimeout(() => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === "vision-ml"
                  ? { ...n, status: "success", progress: 100 }
                  : n,
              ),
            );

            setTimeout(() => {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === "synthesize"
                    ? { ...n, status: "success", progress: 100 }
                    : n,
                ),
              );

              // Proceed to next phase with mock data
              onComplete([
                {
                  id: 1,
                  title: "Role-Based Access Control",
                  cost: 5,
                  source: "Competitor A",
                },
                {
                  id: 2,
                  title: "Real-time Collaboration",
                  cost: 12,
                  source: "Competitor B",
                },
                {
                  id: 3,
                  title: "AI Automation Workflow",
                  cost: 20,
                  source: "Competitor A",
                },
              ]);
            }, 1000);
          }, 2000);
        }, 1000);
      }
    });

    eventSource.addEventListener("failed", (e: any) => {
      const data = JSON.parse(e.data);
      let targetNodeId = "synthesize";
      if (data.jobId?.includes("scrape")) targetNodeId = "network-io";
      else if (data.jobId?.includes("vision")) targetNodeId = "vision-ml";

      setNodes((prev) =>
        prev.map((n) =>
          n.id === targetNodeId
            ? { ...n, status: "failed", error: data.error }
            : n,
        ),
      );
    });

    return () => {
      eventSource.close();
    };
  }, [jobId, onComplete]);

  return (
    <div className="flex-1 w-full bg-[#111] text-white p-8 relative flex items-center justify-center font-mono">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 flex flex-col">
        <div className="mb-12 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-emerald-400">
              <Network size={24} />
              AI Thinking DAG
            </h2>
            <p className="text-white/50 text-sm mt-2">
              Job: {jobId} | Targets: {competitorsCount}
            </p>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Stream
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-xl border relative overflow-hidden transition-colors ${
                  node.status === "success"
                    ? "bg-emerald-900/20 border-emerald-500/30"
                    : node.status === "failed"
                      ? "bg-rose-900/20 border-rose-500/30"
                      : node.status === "processing"
                        ? "bg-sky-900/20 border-sky-500/30"
                        : "bg-white/5 border-white/10"
                }`}
              >
                {/* Progress Bar Background */}
                {node.status === "processing" && (
                  <div
                    className="absolute inset-0 bg-sky-500/5 transition-all duration-300 ease-out"
                    style={{ width: `${node.progress}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      node.status === "success"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : node.status === "failed"
                          ? "bg-rose-500/20 border-rose-500 text-rose-400"
                          : node.status === "processing"
                            ? "bg-sky-500/20 border-sky-500 text-sky-400"
                            : "bg-white/10 border-white/20 text-white/40"
                    }`}
                  >
                    {node.status === "success" && <CheckCircle2 size={20} />}
                    {node.status === "processing" && (
                      <Loader2 size={20} className="animate-spin" />
                    )}
                    {node.status === "failed" && <AlertTriangle size={20} />}
                    {node.status === "pending" && (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-lg ${
                        node.status === "pending"
                          ? "text-white/50"
                          : "text-white"
                      }`}
                    >
                      {node.label}
                    </h3>
                    {node.status === "processing" && (
                      <p className="text-sky-400 text-sm mt-1">
                        {node.progress}% Complete...
                      </p>
                    )}
                    {node.status === "failed" && (
                      <p className="text-rose-400 text-sm mt-1">{node.error}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
