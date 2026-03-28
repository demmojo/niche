import React, { useState, useEffect } from "react";
import { supabase } from "../utils/hashing";
import { Inbox, FileText, Check, X, GitBranch } from "lucide-react";

interface InboxItem {
  id: string;
  pending_data_type: "json" | "markdown" | "image";
  pending_blob_uri: string;
  similarity_score: number;
  matched_logical_asset_id: string;
  created_at: string;
  status: string;
}

export const ApprovalInbox: React.FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocalDbOffline, setIsLocalDbOffline] = useState(false);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        if (!supabase) {
          setIsLocalDbOffline(true);
          throw new Error("Supabase client not initialized.");
        }

        const { data, error } = await supabase
          .from("raw_data_inbox")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) {
          if (
            error.message?.includes("Failed to fetch") ||
            error.code === "TypeError"
          ) {
            setIsLocalDbOffline(true);
          }
          console.warn("Supabase fetch failed:", error);
          loadMockData();
        } else {
          setItems(data || []);
        }
      } catch (err: any) {
        if (err.message?.includes("Failed to fetch") || !supabase) {
          setIsLocalDbOffline(true);
        }
        console.error("Failed to fetch inbox:", err);
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    const loadMockData = () => {
      // Mock data if no DB yet
      setItems([
        {
          id: "inbox-1",
          pending_data_type: "markdown",
          pending_blob_uri: "s3://bucket/new_scrape.md",
          similarity_score: 2, // Hamming distance
          matched_logical_asset_id: "asset-44",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);
    };

    fetchInbox();
  }, []);

  const handleAction = async (
    id: string,
    action: "keep_both" | "update" | "discard",
  ) => {
    // Optimistic UI update
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      if (!supabase) throw new Error("Supabase not available");
      await supabase
        .from("raw_data_inbox")
        .update({
          status: `resolved_${action}`,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      // In a real app, you'd trigger a backend function here to actually perform the DB inserts for update/keep_both
      console.log(
        `Action ${action} taken on item ${id}. Backend worker should process this.`,
      );
    } catch (err) {
      console.warn(
        `Database offline or error. Action ${action} performed optimistically on UI only.`,
        err,
      );
      // Rollback optimistic update on error would go here if not explicitly ignoring it for demo/offline mock
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading inbox...</div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full mt-6">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Inbox size={20} className="text-indigo-600" />
          Approval Inbox
          {items.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {items.length} Pending
            </span>
          )}
        </h2>
      </div>

      {isLocalDbOffline && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800 flex items-center justify-center gap-2">
          ⚠️ <strong>Local Database Offline:</strong> Supabase is unreachable.
          Displaying fallback mock data. Actions will not persist.
        </div>
      )}

      <div className="p-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center">
            <Inbox size={48} className="text-gray-300 mb-4" />
            <p>No pending approvals. Your data library is clean.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} className="text-indigo-500" />
                    <h3 className="font-medium text-gray-900">
                      Highly Similar Data Detected
                    </h3>
                    <span className="text-xs text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                      {item.pending_data_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Found potential duplicate for asset{" "}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">
                      {item.matched_logical_asset_id.substring(0, 8)}
                    </code>
                    with distance score <strong>{item.similarity_score}</strong>
                    .
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>

              {/* Diff Viewer Placeholder */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 text-center text-sm text-gray-500 italic">
                [ Side-by-Side Diff Viewer Component Loading... ] <br />
                <span className="text-xs text-gray-400">
                  Left: Current Version | Right: Pending Data
                </span>
              </div>

              <div className="flex gap-3 justify-end border-t border-gray-100 pt-3">
                <button
                  onClick={() => handleAction(item.id, "discard")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X size={16} /> Discard
                </button>
                <button
                  onClick={() => handleAction(item.id, "keep_both")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded transition-colors"
                >
                  <GitBranch size={16} /> Keep Both (Fork)
                </button>
                <button
                  onClick={() => handleAction(item.id, "update")}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                >
                  <Check size={16} /> Update Version
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
