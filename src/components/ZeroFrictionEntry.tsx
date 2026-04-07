import React, { useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useAuth } from "./AuthProvider";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { isMockAuthEnabled } from "../utils/testEnv";
import { useIsMounted } from "../hooks/useIsMounted";
import { Button } from "./ui/Button";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { parseSSEStream } from "../utils/sse";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { cn } from "../lib/utils";

export interface IdeaPayload {
  url?: string;
  productName?: string;
  productDescription?: string;
}

export interface CompletePayload {
  name: string;
  description: string;
  targetRegions: string[];
  features: unknown[];
  strategy: unknown[];
  jobId: string | null;
  visibility: string;
}

export function ZeroFrictionEntry({
  onComplete,
  onIntentSelected,
  onLoginClick,
  isEmbedded = false,
}: {
  onComplete: (product: CompletePayload) => void;
  onIntentSelected?: () => void; // Kept for backwards compatibility if needed
  onLoginClick?: () => void;
  isEmbedded?: boolean;
}) {
  const { user } = useAuth();
  const [idea, setIdea] = useState("");
  const [step, setStep] = useState<"input" | "analyzing" | "result">("input");
  const [statusMessage, setStatusMessage] = useState("");
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useIsMounted();
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setError(null);
    setStep("analyzing");
    setCompetitors([]);
    setStatusMessage("Initializing engines...");

    if (onIntentSelected) onIntentSelected();

    // Sign in anonymously if needed
    if (!user && !isMockAuthEnabled()) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        // Continue anyway, backend will use anonymous or fail
      }
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetchWithAppCheck("/api/niche/validate-jit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ idea: idea.trim() }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      await parseSSEStream(response, (parsed) => {
        if (!isMounted.current) return true;

        if (parsed.type === "status") {
          setStatusMessage(parsed.value.message);
        } else if (parsed.type === "chunk") {
          // You could parse partial JSON here if needed, but we wait for complete
        } else if (parsed.type === "complete") {
          setCompetitors(parsed.value.competitors || []);
          setStep("result");
        } else if (parsed.type === "error") {
          setError(parsed.value.message || "An error occurred");
          setStep("input");
          return true; // halt
        }
      });
    } catch (err: any) {
      if (err.name !== "AbortError" && isMounted.current) {
        setError(err.message || "Failed to analyze market");
        setStep("input");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefine = () => {
    // Reverse Demo Hook -> proceed to main app
    onComplete({
      name: "AI Idea",
      description: idea,
      targetRegions: ["Global"],
      features: [],
      strategy: competitors, // Pass discovered competitors as initial strategy/context
      jobId: null,
      visibility: "private",
    });
  };

  if (step === "analyzing") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center space-y-6",
          isEmbedded ? "py-12" : "min-h-[60vh]",
        )}
      >
        <Loader2 className="w-12 h-12 animate-spin text-ink-dark/40" />
        <h2 className="text-2xl font-bold font-serif text-ink-dark animate-pulse">
          {statusMessage}
        </h2>
        <p className="text-ink-dark/60">Scanning millions of startups...</p>
      </div>
    );
  }

  if (step === "result") {
    const tarpitCount = competitors.filter(
      (c) => c.is_hyper_velocity_tarpit,
    ).length;
    const isTarpit = tarpitCount > 2 || competitors.length >= 5;

    return (
      <div
        className={cn(
          "max-w-2xl mx-auto space-y-8",
          isEmbedded ? "py-4" : "py-12",
        )}
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-dark/5 mb-4">
            <Activity className="w-8 h-8 text-ink-dark" />
          </div>
          <h2 className="text-3xl font-bold font-serif text-ink-dark">
            Market Gravity Detected
          </h2>
          <p className="text-xl text-ink-dark/70">
            {isTarpit
              ? `We found ${competitors.length} competitors. This looks like a high-velocity tarpit.`
              : `We found ${competitors.length} competitors. There might be space here.`}
          </p>
        </div>

        <div className="bg-white border-2 border-ink-dark/10 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Live Market Analysis
          </h3>
          <ul className="space-y-3">
            {competitors.slice(0, 5).map((comp, i) => (
              <li
                key={i}
                className="flex justify-between items-center border-b border-ink-dark/5 pb-2 last:border-0"
              >
                <span className="font-medium text-ink-dark">{comp.domain}</span>
                {comp.is_hyper_velocity_tarpit && (
                  <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                    TARPIT
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-6">
          <Button
            onClick={handleRefine}
            className="w-full text-lg py-6 bg-ink-dark text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            Refine & Protect This Idea <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-xl mx-auto space-y-8",
        isEmbedded ? "py-4" : "py-20",
      )}
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold font-serif text-ink-dark tracking-tight">
          Don't build in a Tarpit.
        </h1>
        <p className="text-xl text-ink-dark/70">
          Enter your startup idea or URL. We'll tell you instantly if you're
          walking into a trap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-ink-dark/20 to-ink-dark/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white rounded-2xl border-2 border-ink-dark/20 shadow-sm p-2 flex items-center">
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. AI for contract review, or notion.so"
              className="w-full px-4 py-4 text-lg bg-transparent outline-none text-ink-dark placeholder:text-ink-dark/30"
              autoFocus
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!idea.trim()}
          className="w-full text-lg py-6 bg-ink-dark text-white rounded-xl shadow-md hover:bg-black hover:shadow-lg transition-all"
        >
          Analyze Market Gravity <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
