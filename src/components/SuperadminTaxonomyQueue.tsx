import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Combine, AlertTriangle, Check, X, Loader2 } from "lucide-react";

/**
 *
 */
export function SuperadminTaxonomyQueue() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("mock_auth=true")
    ) {
      return;
    }
    const q = query(
      collection(db, "taxonomy_proposals"),
      where("status", "==", "pending_superadmin"),
    );
    return onSnapshot(q, (snap) => {
      setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /**
   *
   */
  const handleApprove = async (proposal: any) => {
    setProcessing(proposal.id);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Mark proposal as approved
        const proposalRef = doc(db, "taxonomy_proposals", proposal.id);
        transaction.update(proposalRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
        });

        // 2. Append-Only SCD Type 2 Taxonomy
        const globalTaxRef = doc(db, "taxonomy_global", `node_${Date.now()}`);
        transaction.set(globalTaxRef, {
          name: proposal.customName,
          originalFeatures: proposal.featuresToMerge,
          status: "active",
          createdAt: serverTimestamp(),
        });

        // Previous nodes (if existed) would be marked is_current: false here

        // 3. Outbox Pattern for Scoring
        const outboxRef = doc(collection(db, "taxonomy_merge_events"));
        transaction.set(outboxRef, {
          type: "MERGE_APPROVED",
          proposalId: proposal.id,
          targetNode: globalTaxRef.id,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  /**
   *
   */
  const handleReject = async (proposalId: string) => {
    setProcessing(proposalId);
    try {
      await runTransaction(db, async (transaction) => {
        const proposalRef = doc(db, "taxonomy_proposals", proposalId);
        transaction.update(proposalRef, {
          status: "rejected",
          rejectedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  if (proposals.length === 0) {
    return (
      <div className="p-8 text-center text-ink-dark/50">
        No pending taxonomy merges.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Combine /> Superadmin Taxonomy Queue
      </h2>
      <div className="grid gap-4">
        {proposals.map((p) => (
          <div
            key={p.id}
            className="border border-ink-dark/20 p-4 rounded-xl bg-white shadow-sm flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {(p.featuresToMerge || []).map((f: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-medium rounded border border-rose-200 line-through"
                    >
                      {f}
                    </span>
                  ))}
                  <span className="text-ink-dark/40">➔</span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-200">
                    {p.customName}
                  </span>
                </div>
                <div className="text-xs text-ink-dark/60 flex items-center gap-4">
                  <span>
                    Cosine Similarity:{" "}
                    {p.similarityScore !== undefined
                      ? (p.similarityScore * 100).toFixed(1)
                      : "?"}
                    %
                  </span>
                  {p.llmValidated && (
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      <Check size={12} /> LLM Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReject(p.id)}
                  disabled={processing !== null}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Reject and keep local-only"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => handleApprove(p)}
                  disabled={processing !== null}
                  className="px-4 py-2 bg-ink-dark text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-black transition-colors"
                >
                  {processing === p.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Approve Global Update
                </button>
              </div>
            </div>

            {/* Pre-Flight Impact Radius Mockup */}
            <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <div className="text-sm text-amber-900">
                <strong>Pre-Flight Impact Radius:</strong> Approving this merge
                will cascade to 14 existing projects. 2 projects will shift from
                "Blue Ocean" to "Tarpit" (Warning alerts will be dispatched).
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
