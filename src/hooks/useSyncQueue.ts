import { useState, useCallback } from 'react';
import { SyncDiff } from '../types';

export function useSyncQueue() {
  const [syncQueue, setSyncQueue] = useState<SyncDiff[]>([]);

  const queueSyncChanges = useCallback((diffs: SyncDiff[]) => {
    setSyncQueue(prev => [...prev, ...diffs]);
  }, []);

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
  }, []);

  const removeSyncChange = useCallback((id: string) => {
    setSyncQueue(prev => prev.filter(diff => diff.id !== id));
  }, []);

  return {
    syncQueue,
    setSyncQueue,
    queueSyncChanges,
    clearSyncQueue,
    removeSyncChange
  };
}
