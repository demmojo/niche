import React, { useState, useTransition, useEffect } from "react";
import { AlertTriangle, Users, Play, LogOut, Activity } from "lucide-react";
import { initializeApp, deleteApp, getApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db, startImpersonation } from "../firebase";

interface StrategicSummary {
  strategic_summary: string;
  action_items: string[];
  referenced_metrics: Array<{ metric_name: string; exact_value: number }>;
}

type SummaryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: StrategicSummary }
  | { status: "error"; error: string };

export function SuperadminAnalytics({
  isSuperadmin,
}: {
  isSuperadmin: boolean;
}) {
  const [summaryState, setSummaryState] = useState<SummaryState>({
    status: "idle",
  });
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isSuperadmin) return;

    // Fetch a few recent users to show in the impersonation table
    const fetchUsers = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(
          (import.meta.env.VITE_API_BASE_URL || "") + "/api/superadmin/users",
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch superadmin users");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error("Error fetching users for superadmin:", err);
      }
    };

    fetchUsers();
  }, [isSuperadmin]);

  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center text-ink-dark/60">
        <AlertTriangle size={32} className="mb-4 text-accent-coral mx-auto" />
        <p>Access Denied. You must be a superadmin to view this page.</p>
      </div>
    );
  }

  const generateSummary = async () => {
    setSummaryState({ status: "loading" });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") + "/api/v1/summary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            context: "Looking for feature-bloat indicators.",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch summary");

      const data: StrategicSummary = await response.json();

      startTransition(() => {
        setSummaryState({ status: "success", data });
      });
    } catch (err) {
      startTransition(() => {
        setSummaryState({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    }
  };

  const handleImpersonate = async (targetUid: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") +
          "/api/superadmin/impersonate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ targetUid }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to impersonate");

      // Secondary App logic
      await startImpersonation(data.token);

      // Reload the page to reset all states with the new auth context
      window.location.href = "/";
    } catch (err: any) {
      alert("Impersonation failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-ink-dark tracking-tight mb-2">
          Platform Telemetry & Operations
        </h1>
        <p className="text-ink-dark/60">
          Actionable MVP signals and administrative magic login.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Generative UI Summary */}
        <div className="bg-paper-light border-2 border-ink-dark rounded-xl p-6 shadow-storybook">
          <div className="mb-6 pb-4 border-b border-ink-dark/20 flex justify-between items-center">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Activity size={20} className="text-accent-coral" />
              Strategic Summary
            </h2>
            <button
              onClick={generateSummary}
              disabled={summaryState.status === "loading"}
              className="px-4 py-2 bg-ink-dark text-white font-bold text-sm uppercase rounded-md hover:bg-ink-dark/80 disabled:opacity-50 transition-colors"
            >
              {summaryState.status === "loading"
                ? "Analyzing..."
                : "Generate Review"}
            </button>
          </div>

          {summaryState.status === "error" && (
            <div className="mb-4 p-4 bg-accent-coral/10 border-l-4 border-accent-coral font-mono text-sm text-ink-dark">
              {summaryState.error}
            </div>
          )}

          {summaryState.status === "idle" && (
            <p className="text-ink-dark/60 italic text-sm text-center py-8">
              Click generate to run the 4-Event LLM analysis.
            </p>
          )}

          {summaryState.status === "success" && (
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold uppercase text-moss mb-2">
                  Executive Summary
                </h3>
                <p className="text-ink-dark leading-relaxed font-serif text-lg">
                  {summaryState.data.strategic_summary}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase text-accent-coral mb-2">
                  Action Items
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  {summaryState.data.action_items.map((item, idx) => (
                    <li key={idx} className="text-ink-dark font-medium">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase text-ink-dark/40 mb-2">
                  Cited Metrics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summaryState.data.referenced_metrics.map((metric, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-ink-dark/5 text-ink-dark rounded text-xs font-mono"
                    >
                      {metric.metric_name}: {metric.exact_value}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Magic Login Users Table */}
        <div className="bg-paper-light border-2 border-ink-dark rounded-xl p-6 shadow-storybook">
          <div className="mb-6 pb-4 border-b border-ink-dark/20">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Users size={20} className="text-moss" />
              Active Users (Magic Login)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink-dark/20 text-ink-dark/60 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">User ID</th>
                  <th className="pb-3 font-semibold">Project Name</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-ink-dark">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-ink-dark/50 italic"
                    >
                      No recent active projects found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr
                      key={i}
                      className="border-b border-ink-dark/10 last:border-0 hover:bg-ink-dark/5 transition-colors"
                    >
                      <td className="py-4 font-mono text-xs">
                        {u.uid.slice(0, 8)}...
                      </td>
                      <td className="py-4 font-medium">{u.name}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleImpersonate(u.uid)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink-dark/10 hover:bg-ink-dark/20 text-ink-dark font-bold rounded transition-colors text-xs uppercase tracking-wide"
                        >
                          <Play size={14} />
                          Login As
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
