import React, { useState, useEffect, useTransition, useRef } from "react";
import {
  collection,
  query,
  where,
  getCountFromServer,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../AuthProvider";
import { useNicheGenerativeStream } from "../../hooks/useNicheGenerativeStream";
import { GenerativeErrorBoundary } from "../ErrorBoundary/GenerativeErrorBoundary";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// AST Security: Strict URL allowlist to prevent XSS
const urlTransform = (url: string) => {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  ) {
    return url;
  }
  return ""; // Block data:, blob:, javascript: etc.
};

export const RoastMyNiche: React.FC = () => {
  const { user } = useAuth();
  const transition = useTransition();
  const isPending = transition[0];
  const startTransition = transition[1];
  const [idea, setIdea] = useState("");
  const [email, setEmail] = useState("");
  const {
    data: streamData,
    isLoading: isStreamLoading,
    error: streamError,
    generate,
  } = useNicheGenerativeStream({
    endpoint:
      (import.meta.env.VITE_API_BASE_URL || "") + "/api/llm/generateStream", // Changed to generic LLM stream endpoint
  });

  const [emailLoading, setEmailLoading] = useState(false);
  const loading = isPending || emailLoading || isStreamLoading;
  const [loadingStatus, setLoadingStatus] = useState("");
  const [isThrottled, setIsThrottled] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Sync stream error to local error for UI
  useEffect(() => {
    if (streamError) {
      setError(streamError);
    }
  }, [streamError]);

  useEffect(() => {
    const checkQueue = async () => {
      try {
        const q = query(
          collection(db, "pending_reports"),
          where("status", "==", "pending"),
        );
        const snapshot = await getCountFromServer(q);
        if (snapshot.data().count > 50) {
          setIsThrottled(true);
        }
      } catch (err) {
        console.error("Failed to check queue", err);
      }
    };
    checkQueue();
  }, []);

  const handleRoast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setError("");
    setLoadingStatus("Analyzing market saturation...");

    startTransition(async () => {
      try {
        // Fallback for missing env var during tests
        const token = user ? await user.getIdToken() : undefined;
        const endpoint =
          (import.meta.env.VITE_API_BASE_URL || "") + "/api/llm/generateStream";

        await generate(
          {
            model: "gemini-3.1-pro", // Fallback or remote config managed ideally
            params: {
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Roast this startup idea brutally but constructively: ${idea}`,
                    },
                  ],
                },
              ],
              config: {
                temperature: 0.7,
              },
            },
          },
          token,
        );

        setLoadingStatus("");
      } catch (err: any) {
        setError(err.message || "Failed to fetch analysis. Please try again.");
        setLoadingStatus("");
      }
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;
    setEmailLoading(true);
    setLoadingStatus("Submitting for deep dive...");
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") + "/api/campaign/submit-lead",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ idea, email }),
        },
      );

      if (!response.ok) throw new Error("Failed to submit");
      setIsSubmitted(true);
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setEmailLoading(false);
      setLoadingStatus("");
    }
  };

  if (isThrottled) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 text-zinc-100 min-h-screen">
        <h1 className="text-3xl font-bold text-red-400 mb-4">
          High Volume - Check Back Later
        </h1>
        <p className="text-zinc-400">
          Our system is currently processing maximum capacity. Please try again
          in an hour.
        </p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 text-zinc-100 min-h-screen">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">
          We're preparing your deep dive report
        </h2>
        <p className="text-zinc-400">You will receive an email shortly.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 text-zinc-100 min-h-screen">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          Roast My Niche
        </h1>

        <form onSubmit={handleRoast} className="space-y-4 mb-8">
          <textarea
            className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            rows={4}
            placeholder="Describe your product idea (e.g. A CRM for dog walkers)..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading || !!loadingStatus}
            required
          />
          <button
            type="submit"
            disabled={loading || !!loadingStatus || !idea.trim()}
            className="w-full py-3 px-6 bg-zinc-100 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Roast My Idea
          </button>
        </form>

        {streamData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenerativeErrorBoundary>
              <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 prose prose-invert max-w-none">
                <ReactMarkdown
                  rehypePlugins={[[rehypeSanitize, defaultSchema]]}
                  urlTransform={urlTransform}
                >
                  {streamData}
                </ReactMarkdown>
              </div>
            </GenerativeErrorBoundary>

            {/* Email form moved to its own component or kept here but only visible after stream completes or alongside it */}
            {!loading && (
              <form
                onSubmit={handleEmailSubmit}
                className="space-y-4 bg-zinc-800/50 p-6 rounded-lg border border-zinc-700/50 mt-8"
              >
                <h4 className="text-lg font-medium text-white">
                  Want the deep dive?
                </h4>
                <p className="text-sm text-zinc-400">
                  Our agents will generate a comprehensive market and competitor
                  analysis.
                </p>
                <input
                  type="email"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Enter your email for the deep dive"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 px-6 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Get Full Report
                </button>
              </form>
            )}
          </div>
        )}

        {/* Explainable State */}
        <div aria-live="polite" className="mt-6 text-center h-6">
          {(loading || loadingStatus) && !error ? (
            <span className="text-emerald-400 font-medium animate-pulse">
              {loadingStatus}
            </span>
          ) : null}
          {error && <span className="text-red-400 font-medium">{error}</span>}
        </div>
      </div>
    </div>
  );
};
