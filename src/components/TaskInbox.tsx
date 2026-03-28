import React, { useState } from "react";
import { useApprovalStore } from "../hooks/useApprovalStore";
import { useShallow } from "zustand/react/shallow";
import { Inbox, FileText, Check, X, GitBranch, Database } from "lucide-react";

/**
 *
 */
export const TaskInbox: React.FC = () => {
  const { items, resolveItems, loading } = useApprovalStore(
    useShallow((state) => ({
      items: state.items,
      resolveItems: state.resolveItems,
      loading: state.loading,
    })),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   *
   */
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.id));
    }
  };

  /**
   *
   */
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  /**
   *
   */
  const handleBatchAction = async (
    action: "keep_both" | "update" | "discard",
  ) => {
    if (selectedIds.length === 0) return;
    await resolveItems(selectedIds, action);
    setSelectedIds([]);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading inbox...</div>
    );

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h1 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
            <Inbox className="text-blue-600" /> Task Inbox
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and merge duplicate raw data entries.
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === items.length && items.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.length} selected
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleBatchAction("keep_both")}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
            >
              <GitBranch size={16} /> Group (Keep Both)
            </button>
            <button
              onClick={() => handleBatchAction("update")}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 transition-colors"
            >
              <Check size={16} /> Update & Archive
            </button>
            <button
              onClick={() => handleBatchAction("discard")}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded disabled:opacity-50 transition-colors"
            >
              <X size={16} /> Keep Old (Discard New)
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <Inbox size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              You're all caught up!
            </h3>
            <p>No pending approvals. Your data library is clean.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${selectedIds.includes(item.id) ? "bg-blue-50/50 border-blue-200" : "bg-white border-gray-200 hover:border-blue-300"}`}
            >
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} className="text-blue-500" />
                  <span className="font-medium text-gray-900 truncate">
                    Pending {item.pending_data_type} match
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Similarity: {item.similarity_score}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Database size={14} className="text-gray-400" />
                  Target Asset:{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {item.matched_logical_asset_id.substring(0, 8)}
                  </code>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Captured on {new Date(item.created_at).toLocaleString()}
                </div>

                <div className="mt-3 bg-gray-50 rounded p-3 text-sm text-gray-600 border border-gray-100 font-mono text-xs overflow-hidden text-ellipsis">
                  {item.pending_blob_uri}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
