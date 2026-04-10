import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getCountFromServer,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../AuthProvider";

export const RoastMyNiche: React.FC = () => {
  const { user } = useAuth();
  const [idea, setIdea] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

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

  const handleRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setLoadingStatus("Analyzing market saturation...");
    setError("");

    try {
      const response = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") + "/api/llm/surface-roast",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea }),
        },
      );

      if (!response.ok) throw new Error("Failed to get roast");
      const data = await response.json();
      setBullets(data.bullets);
    } catch (err) {
      setError("Failed to fetch analysis. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;
    setLoading(true);
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
      setLoading(false);
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

        {!bullets ? (
          <form onSubmit={handleRoast} className="space-y-4">
            <textarea
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              rows={4}
              placeholder="Describe your product idea (e.g. A CRM for dog walkers)..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !idea.trim()}
              className="w-full py-3 px-6 bg-zinc-100 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Roast My Idea
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
              <h3 className="text-xl font-semibold mb-4 text-emerald-400">
                Surface Roast Results
              </h3>
              <ul className="space-y-3">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-zinc-500 mr-3">•</span>
                    <span className="text-zinc-200">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <form
              onSubmit={handleEmailSubmit}
              className="space-y-4 bg-zinc-800/50 p-6 rounded-lg border border-zinc-700/50"
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
          </div>
        )}

        {/* Explainable State */}
        <div aria-live="polite" className="mt-6 text-center h-6">
          {loading && (
            <span className="text-emerald-400 font-medium animate-pulse">
              {loadingStatus}
            </span>
          )}
          {error && <span className="text-red-400 font-medium">{error}</span>}
        </div>
      </div>
    </div>
  );
};
