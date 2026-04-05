import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { FeedbackMessage } from "../types";
import {
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Loader2,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import { DataMoatControlTab } from "./superadmin/DataMoatControlTab";

/**
 * Superadmin Dashboard
 */
export function SuperadminDashboard({
  isSuperadmin,
}: {
  isSuperadmin: boolean;
}) {
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feedback" | "data_quality">(
    "data_quality",
  );

  useEffect(() => {
    if (!isSuperadmin) return;

    /**
     * Fetch alpha feedback
     */
    const fetchFeedback = async () => {
      try {
        const q = query(
          collection(db, "alpha_feedback"),
          orderBy("timestamp", "desc"),
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as FeedbackMessage,
        );
        setFeedback(results);
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isSuperadmin]);

  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center text-ink-dark/60">
        <AlertCircle size={32} className="mb-4 text-accent-coral mx-auto" />
        <p>Access Denied. You must be a superadmin to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dark/40" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-ink-dark tracking-tight mb-2">
          Superadmin Dashboard
        </h1>
        <p className="text-ink-dark/60">
          Monitor system health, pipeline quality, and user feedback.
        </p>
      </div>

      <div className="flex gap-4 border-b border-ink-dark/10 mb-8">
        <button
          onClick={() => setActiveTab("data_quality")}
          className={`pb-4 px-2 font-semibold text-sm transition-colors relative ${
            activeTab === "data_quality"
              ? "text-ink-dark"
              : "text-ink-dark/50 hover:text-ink-dark/80"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Data Quality & Control
          </div>
          {activeTab === "data_quality" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-dark rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`pb-4 px-2 font-semibold text-sm transition-colors relative ${
            activeTab === "feedback"
              ? "text-ink-dark"
              : "text-ink-dark/50 hover:text-ink-dark/80"
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Alpha Feedback
          </div>
          {activeTab === "feedback" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-dark rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "data_quality" ? (
        <DataMoatControlTab />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {feedback.length === 0 ? (
            <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-12 text-center text-ink-dark/50">
              No feedback submitted yet.
            </div>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === "Bug"
                          ? "bg-accent-coral/10 text-accent-coral"
                          : item.type === "Feature"
                            ? "bg-accent-teal/10 text-accent-teal"
                            : "bg-accent-purple/10 text-accent-purple"
                      }`}
                    >
                      {item.type === "Bug" ? (
                        <AlertCircle size={16} />
                      ) : item.type === "Feature" ? (
                        <Lightbulb size={16} />
                      ) : (
                        <MessageSquare size={16} />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-ink-dark">
                        {item.type}
                      </span>
                      <span className="text-ink-dark/40 text-sm ml-3">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-ink-dark/70 font-mono">
                      {item.userEmail || "Unknown User"}
                    </span>
                  </div>
                </div>

                <div className="bg-paper-base rounded-xl p-4 text-sm font-sans whitespace-pre-wrap text-ink-dark/90 border border-ink-dark/5">
                  {item.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
