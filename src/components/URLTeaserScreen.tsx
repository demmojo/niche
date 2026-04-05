import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { Loader2, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";

export function URLTeaserScreen({
  url,
  onComplete,
}: {
  url: string;
  onComplete: (data: any) => void;
}) {
  const [status, setStatus] = useState<string>("Initializing...");
  const [metadata, setMetadata] = useState<any>(null);
  const [teaser, setTeaser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function streamTeaser() {
      try {
        const response = await fetchWithAppCheck("/api/scoring/url-teaser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ url }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Server returned ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const chunk of parts) {
            if (chunk.trim() === "") continue;
            try {
              const data = JSON.parse(chunk.replace(/^data:\s*/, ""));

              if (data.type === "status") {
                setStatus(data.value);
              } else if (data.type === "metadata") {
                setMetadata(data.value);
                setStatus(`Reading: ${data.value.title}`);
              } else if (data.type === "teaser") {
                setTeaser(data.value);
                setStatus("Complete");
              } else if (data.type === "error") {
                setError(data.value);
                return;
              }
            } catch (e) {
              console.error("Parse error on chunk", chunk, e);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      }
    }

    streamTeaser();
    return () => abortController.abort();
  }, [url]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl border border-ink-dark/10 max-w-lg w-full mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-ink-dark mb-2">
          Analysis Failed
        </h2>
        <p className="text-ink-dark/70 text-center mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-ink-dark text-white rounded-xl font-bold hover:bg-black transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED] px-4 py-12">
      <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-ink-dark/10">
        <h2 className="text-2xl font-serif font-bold text-ink-dark mb-6 text-center">
          Analyzing URL
        </h2>

        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-ink-dark/5">
          <p className="text-sm font-mono text-ink-dark/60 truncate">{url}</p>
        </div>

        {!teaser ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-ink-dark/40 mb-6" />
            <p className="text-lg font-medium text-ink-dark animate-pulse">
              {status}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-dark/50 mb-2">
                Identified Core Job
              </h3>
              <p className="text-lg text-ink-dark font-medium leading-relaxed">
                "{teaser.jtbd.job_statement}"
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-dark/50 mb-3">
                Orthogonal Pivot Opportunities
              </h3>
              <ul className="space-y-3">
                {teaser.orthogonal_pivots.map((pivot: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100"
                  >
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <span>{pivot}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-ink-dark/10">
              <button
                onClick={() => onComplete(teaser)}
                className="w-full py-4 bg-ink-dark text-white rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-md"
              >
                Sign Up to Generate Full Strategy
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
