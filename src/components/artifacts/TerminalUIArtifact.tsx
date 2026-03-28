import React, { useState, useEffect, useRef } from "react";
import { B_H2, B_Badge, B_Button, B_Card, B_TextBody } from "../BrutalistUI";
import { Loader2, ArrowRight } from "lucide-react";
import { deployToCloudflare } from "../../services/cloudflareService";

/**
 *
 */
export default function TerminalUIArtifact() {
  const [logs, setLogs] = useState<string[]>([
    "> INITIALIZING DEPLOYMENT PIPELINE...",
  ]);
  const [status, setStatus] = useState<"building" | "success" | "error">(
    "building",
  );
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
            setDeployUrl("https://niche-app-generated.pages.dev");
          }
        }, 800);
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
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0F172A] text-white font-mono">
      <div className="p-6 border-b-4 border-slate-700 flex justify-between items-center bg-slate-900 shrink-0 shadow-[0_4px_0px_0px_#000]">
        <div className="flex items-center gap-4">
          <B_Badge
            variant={
              status === "success"
                ? "success"
                : status === "error"
                  ? "danger"
                  : "info"
            }
          >
            CLOUDFLARE PAGES
          </B_Badge>
          <B_H2 className="uppercase">Deployment Logs</B_H2>
        </div>
        {status === "building" && (
          <Loader2 className="animate-spin text-[var(--color-brutal-cyan)]" />
        )}
      </div>

      <div className="flex-1 p-6 bg-black overflow-y-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`flex text-sm ${log.includes("ERROR") ? "text-[var(--color-brutal-red)] font-bold" : "text-[var(--color-brutal-chartreuse)]"}`}
            >
              <ArrowRight size={14} className="mt-1 mr-2 opacity-50 shrink-0" />
              <span className="break-all">{log}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {status === "success" && deployUrl && (
        <div className="p-6 border-t-4 border-[var(--color-brutal-chartreuse)] bg-slate-900 shrink-0">
          <B_Card className="border-4 border-[var(--color-brutal-chartreuse)] bg-black p-6 rounded-none shadow-[8px_8px_0px_0px_var(--color-brutal-chartreuse)]">
            <div className="font-bold uppercase tracking-tight text-[var(--color-brutal-chartreuse)] mb-2 flex items-center gap-2">
              <span className="w-3 h-3 bg-[var(--color-brutal-chartreuse)] animate-pulse rounded-full" />
              DEPLOYMENT SUCCESSFUL
            </div>
            <B_TextBody className="text-white text-lg mb-6">
              Your hyper-niche application is now live and serving traffic.
            </B_TextBody>
            <div className="flex gap-4">
              <a
                href={deployUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center bg-[var(--color-brutal-chartreuse)] text-black border-2 border-[var(--color-brutal-chartreuse)] font-bold uppercase py-3 hover:bg-white hover:border-white transition-colors"
              >
                OPEN APP ↗
              </a>
              <B_Button
                variant="outline"
                className="flex-1 text-white border-slate-500 hover:border-white"
              >
                VIEW DASHBOARD
              </B_Button>
            </div>
          </B_Card>
        </div>
      )}
    </div>
  );
}
