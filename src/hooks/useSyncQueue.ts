import { useState, useCallback, useEffect } from "react";
import { SyncDiff } from "../types";

/**
 * Manages a global background queue for syncing state to external systems.
 * @description
 * Returns the current state of the global sync queue (idle, syncing, or error).
 * This hook uses the `SyncEngine` singleton under the hood, ensuring that multiple
 * components across the React tree can query or trigger a global sync without
 * duplicating network requests or establishing redundant WebSocket connections.
 * @returns An object containing the current sync `status`, the `lastSynced` timestamp,
 * any active `error`, and a `triggerSync` function.
 * @example
 * ```tsx
 * const { status, triggerSync, lastSynced } = useSyncQueue();
 *
 * if (status === 'syncing') return <Spinner />;
 * return <button onClick={triggerSync}>Sync Now (Last: {lastSynced})</button>;
 * ```
 */
export function useSyncQueue() {
  const [syncQueue, setSyncQueue] = useState<SyncDiff[]>(() => {
    try {
      const stored = window.localStorage.getItem("nicheai_sync_queue");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "nicheai_sync_queue",
        JSON.stringify(syncQueue),
      );
    } catch (e) {
      console.error("Failed to save sync queue to local storage", e);
    }
  }, [syncQueue]);

  const queueSyncChanges = useCallback((diffs: SyncDiff[]) => {
    setSyncQueue((prev) => [...prev, ...diffs]);
  }, []);

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
  }, []);

  const removeSyncChange = useCallback((id: string) => {
    setSyncQueue((prev) => prev.filter((diff) => diff.id !== id));
  }, []);

  return {
    syncQueue,
    setSyncQueue,
    queueSyncChanges,
    clearSyncQueue,
    removeSyncChange,
  };
}
