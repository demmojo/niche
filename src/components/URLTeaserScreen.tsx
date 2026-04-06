import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { Loader2, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { parseSSEStream } from "../utils/sse";
import { AsyncButton } from "./AsyncButton";
import { useAuth } from "./AuthProvider";
import {
  useAuthDialogDispatch,
  useAuthDialogState,
} from "./AuthDialogProvider";

export interface TeaserMetadata {
  title?: string;
  description?: string;
  domain?: string;
}

export interface TeaserData {
  summary?: string;
  key_findings?: string[];
  orthogonal_pivots?: string[];
  jtbd?: {
    job_statement?: string;
  };
}

export function URLTeaserScreen({
  url,
  onComplete,
  onCancel,
}: {
  url: string;
  onComplete: (data: TeaserData) => void;
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState<string>("Initializing...");
  const [metadata, setMetadata] = useState<TeaserMetadata | null>(null);
  const [teaser, setTeaser] = useState<TeaserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { user } = useAuth();
  const { openModal } = useAuthDialogDispatch();
  const { isOpen } = useAuthDialogState();

  useEffect(() => {
    if (isSigningUp && !isOpen) {
      const timeout = setTimeout(() => {
        if (!user || user.isAnonymous) {
          setIsSigningUp(false);
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isSigningUp, user]);

  useEffect(() => {
    if (user && !user.isAnonymous && teaser && isSigningUp) {
      setIsSigningUp(false);
      onComplete(teaser);
    }
  }, [user, teaser, isSigningUp, onComplete]);

  const streamTeaser = useCallback(
    async (abortController: AbortController) => {
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

        await parseSSEStream(response, (data) => {
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
            return true; // Halt
          }
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      }
    },
    [url],
  );

  useEffect(() => {
    const abortController = new AbortController();
    streamTeaser(abortController);

    return () => abortController.abort();
  }, [streamTeaser]);

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
                "{teaser.jtbd?.job_statement}"
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-dark/50 mb-3">
                Orthogonal Pivot Opportunities
              </h3>
              <ul className="space-y-3">
                {teaser.orthogonal_pivots?.map((pivot: string, i: number) => (
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
              <AsyncButton
                isPending={isSigningUp}
                loadingText="Signing up..."
                onClick={async () => {
                  if (!teaser) return;
                  setIsSigningUp(true);
                  try {
                    openModal();
                  } catch (e: unknown) {
                    console.error(e);
                  }
                }}
                className="w-full py-4 bg-ink-dark text-white rounded-xl font-bold text-lg hover:bg-black shadow-md"
              >
                Sign Up to Generate Full Strategy
              </AsyncButton>
            </div>
          </motion.div>
        )}

        {onCancel && !teaser && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onCancel()}
              className="px-4 py-2 text-ink-dark/50 hover:text-ink-dark font-medium transition-colors text-sm"
            >
              Cancel Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
