import React, { useState, useMemo, useEffect } from "react";
import { SyncDiff } from "../types";
import { X, Check, Save, List, Target } from "lucide-react";

interface SyncReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncQueue: SyncDiff[];
  onCommit: (selectedIds: string[]) => void;
}

/**
 *
 */
export const SyncReviewModal: React.FC<SyncReviewModalProps> = ({
  isOpen,
  onClose,
  syncQueue,
  onCommit,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(syncQueue.map((d) => d.id)));
    }
  }, [isOpen, syncQueue]);

  const groupedDiffs = useMemo(() => {
    const groups: Record<string, SyncDiff[]> = {};
    syncQueue.forEach((diff) => {
      if (!groups[diff.entityId]) {
        groups[diff.entityId] = [];
      }
      groups[diff.entityId].push(diff);
    });
    return groups;
  }, [syncQueue]);

  if (!isOpen) return null;

  /**
   *
   */
  const handleToggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  /**
   *
   */
  const handleToggleGroup = (entityId: string, groupDiffs: SyncDiff[]) => {
    const groupIds = groupDiffs.map((d) => d.id);
    const allSelected = groupIds.every((id) => selectedIds.has(id));

    const next = new Set(selectedIds);
    if (allSelected) {
      groupIds.forEach((id) => next.delete(id));
    } else {
      groupIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  /**
   *
   */
  const handleSelectAll = () => {
    setSelectedIds(new Set(syncQueue.map((d) => d.id)));
  };

  /**
   *
   */
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-ink-dark/20">
        <div className="p-6 border-b border-ink-dark/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-serif text-ink-dark flex items-center gap-2">
              <List size={24} />
              Review Sync Changes
            </h2>
            <p className="text-sm text-ink-dark/60 mt-1">
              Review and approve incoming data updates to prevent overwriting
              verified information.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-paper-base rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 bg-paper-base border-b border-ink-dark/10 flex justify-between items-center shrink-0">
          <div className="flex gap-4 text-sm font-medium">
            <button
              onClick={handleSelectAll}
              className="text-sky hover:underline"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-rose-600 hover:underline"
            >
              Deselect All
            </button>
          </div>
          <div className="text-sm font-bold text-ink-dark">
            {selectedIds.size} / {syncQueue.length} changes selected
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.entries(groupedDiffs).map(([entityId, diffs]) => {
            const groupIds = diffs.map((d) => d.id);
            const allSelected = groupIds.every((id) => selectedIds.has(id));
            const someSelected = groupIds.some((id) => selectedIds.has(id));

            return (
              <div
                key={entityId}
                className="border border-ink-dark/20 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="bg-ink-dark text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target size={20} />
                    <h3 className="font-bold">
                      {diffs[0].entityType}: {entityId}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleToggleGroup(entityId, diffs)}
                    aria-label={`${allSelected ? "Deselect" : "Select"} Group ${entityId}`}
                    className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {allSelected ? "Deselect Group" : "Select Group"}
                  </button>
                </div>

                <div className="divide-y divide-ink-dark/10">
                  {diffs.map((diff) => (
                    <label
                      key={diff.id}
                      className={`flex items-start gap-4 p-4 hover:bg-paper-base cursor-pointer transition-colors ${!selectedIds.has(diff.id) ? "opacity-50" : ""}`}
                    >
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(diff.id)}
                          aria-label={`Select change for ${diff.description}`}
                          onChange={() => handleToggle(diff.id)}
                          className="w-5 h-5 rounded border-ink-dark/20 text-sky focus:ring-sky"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-ink-dark mb-1">
                          {diff.description}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-ink-dark/50 font-bold mb-2">
                          Field: {diff.field}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-rose-50 text-rose-900 p-3 rounded-lg border border-rose-200">
                            <div className="text-xs font-bold uppercase mb-1 opacity-60">
                              Current Value
                            </div>
                            <div className="font-mono whitespace-pre-wrap">
                              {diff.oldValue !== undefined &&
                              diff.oldValue !== null
                                ? JSON.stringify(diff.oldValue, null, 2)
                                : "Empty"}
                            </div>
                          </div>
                          <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-200">
                            <div className="text-xs font-bold uppercase mb-1 opacity-60">
                              Proposed Value
                            </div>
                            <div className="font-mono whitespace-pre-wrap">
                              {diff.newValue !== undefined &&
                              diff.newValue !== null
                                ? JSON.stringify(diff.newValue, null, 2)
                                : "Empty"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {syncQueue.length === 0 && (
            <div className="text-center text-ink-dark/50 py-12">
              <Check size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold">No pending sync changes</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-ink-dark/10 bg-white shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-ink-dark hover:bg-paper-base rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const selectedArray = Array.from(selectedIds);
              onCommit(selectedArray);

              // Telemetry Event 2: Core Action - Market-Driven Sync Commit
              import("../utils/telemetry").then(({ telemetry }) => {
                const acceptedDiffsCount = selectedArray.length;
                const rejectedDiffsCount =
                  syncQueue.length - acceptedDiffsCount;

                const mutatedEntities = new Set(
                  syncQueue
                    .filter((d) => selectedIds.has(d.id))
                    .map((d) => d.entityType),
                );

                telemetry.push({
                  eventType: "core_action",
                  actorType: "human",
                  payload: {
                    action: "market_driven_sync_commit",
                    acceptedDiffsCount,
                    rejectedDiffsCount,
                    entityTypesMutated: Array.from(mutatedEntities),
                  },
                });
              });

              onClose();
            }}
            disabled={selectedIds.size === 0}
            className="px-6 py-2.5 bg-sky text-white font-bold rounded-lg hover:bg-sky/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Commit {selectedIds.size} Changes
          </button>
        </div>
      </div>
    </div>
  );
};
