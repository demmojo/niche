import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  ArrowRight,
  Server,
  Globe,
  CheckCircle,
  ExternalLink,
  Activity,
} from "lucide-react";
import { deployToCloudflare } from "../../services/cloudflareService";

interface DeploymentVisualizerProps {
  versionName?: string;
  onAuditClick?: () => void;
}

/**
 *
 */
export default function DeploymentVisualizer({
  versionName = "v1.0.0-draft",
  onAuditClick,
}: DeploymentVisualizerProps) {
  const [logs, setLogs] = useState<string[]>([
    `> INITIALIZING DEPLOYMENT FOR ${versionName}...`,
  ]);
  const [status, setStatus] = useState<"building" | "success" | "error">(
    "building",
  );
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      id: "provision",
      label: "Provisioning Environment",
      isComplete: logs.length > 2,
    },
    {
      id: "build",
      label: "Building Next.js Application",
      isComplete: logs.length > 5,
    },
    {
      id: "edge",
      label: "Deploying to Edge Network",
      isComplete: logs.length > 7,
    },
    {
      id: "live",
      label: "Traffic Routing Live",
      isComplete: status === "success",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    /**
     *
     */
    const startDeploy = async () => {
      try {
        const stream = await deployToCloudflare("niche-app-generated");

        let i = 0;
        const interval = setInterval(() => {
          if (!isMounted) return clearInterval(interval);
          if (i < stream.length) {
            setLogs((prev) => [...prev, stream[i]]);
            i++;
          } else {
            clearInterval(interval);
            setStatus("success");
            setDeployUrl(
              `https://${versionName.replace(/\./g, "-")}.niche-app-generated.pages.dev`,
            );
          }
        }, 600);
      } catch (err) {
        if (isMounted) {
          setLogs((prev) => [...prev, `> ERROR: ${String(err)}`]);
          setStatus("error");
        }
      }
    };

    startDeploy();
    return () => {
      isMounted = false;
    };
  }, [versionName]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-paper-base font-mono text-sm overflow-hidden border border-ink-dark/10 rounded-xl shadow-sm">
      {/* Deployment Pipeline Visualizer (Left Sidebar) */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-ink-dark/10 bg-white flex flex-col shrink-0">
        <div className="p-5 border-b border-ink-dark/10">
          <div className="flex items-center gap-3 mb-1">
            <Server size={18} className="text-sky" />
            <h2 className="font-bold font-serif text-ink-dark text-lg">
              Deployment
            </h2>
          </div>
          <p className="text-xs text-ink-dark/60 font-sans">
            Cloudflare Pages Edge Network
          </p>
        </div>

        <div className="p-5 flex-1">
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex gap-4 relative">
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-3.5 top-8 bottom-[-16px] w-0.5 ${step.isComplete ? "bg-emerald-400" : "bg-ink-dark/10"}`}
                  />
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    step.isComplete
                      ? "bg-emerald-500 text-white"
                      : status === "error"
                        ? "bg-rose-500 text-white"
                        : logs.length > idx * 2
                          ? "bg-sky text-white animate-pulse"
                          : "bg-paper-base border border-ink-dark/20 text-ink-dark/40"
                  }`}
                >
                  {step.isComplete ? (
                    <CheckCircle size={14} />
                  ) : status === "error" ? (
                    "!"
                  ) : logs.length > idx * 2 ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>
                <div className="pt-1.5">
                  <p
                    className={`text-sm font-semibold ${step.isComplete ? "text-emerald-700" : "text-ink-dark"}`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {status === "success" && deployUrl && (
          <div className="p-5 bg-emerald-50 border-t border-emerald-100">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live on Edge
            </p>
            <div className="space-y-2">
              <a
                href={deployUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Globe size={14} />
                Open App
                <ExternalLink size={12} className="opacity-70" />
              </a>
              <button
                onClick={onAuditClick}
                className="w-full py-2 bg-white text-ink-dark border border-ink-dark/20 rounded-lg flex items-center justify-center gap-2 font-bold text-xs hover:bg-paper-base transition-colors"
              >
                <Activity size={14} />
                View Audit Analytics
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Logs (Right Area) */}
      <div className="flex-1 bg-[#0F172A] overflow-hidden flex flex-col relative">
        <div className="bg-slate-900 border-b border-slate-700 p-3 flex justify-between items-center shrink-0">
          <span className="text-slate-400 font-bold tracking-widest text-xs uppercase">
            Build Output
          </span>
          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] rounded uppercase font-bold tracking-wider">
            {versionName}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-1 text-xs">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`flex ${log.includes("ERROR") ? "text-rose-400 font-bold" : "text-emerald-400/90"}`}
            >
              <ArrowRight
                size={12}
                className="mt-0.5 mr-2 opacity-50 shrink-0"
              />
              <span className="break-all font-mono leading-relaxed">{log}</span>
            </div>
          ))}
          {status === "building" && (
            <div className="flex text-sky-400 animate-pulse mt-2">
              <span className="mr-2">_</span>
            </div>
          )}
          <div ref={logsEndRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}
