import { renderHook, act } from "../../test-utils/render";
import { describe, it, expect } from "vitest";
import { useSyncQueue } from "../../hooks/useSyncQueue";
import { SyncDiff } from "../../types";

describe("useSyncQueue hook", () => {
  const mockDiff1: SyncDiff = {
    id: "d1",
    entityId: "c1",
    entityType: "Competitor",
    field: "targetAudience",
    oldValue: "A",
    newValue: "B",
  };
  const mockDiff2: SyncDiff = {
    id: "d2",
    entityId: "c1",
    entityType: "Competitor",
    field: "fundingHistory",
    oldValue: "X",
    newValue: "Y",
  };

  it("should initialize with an empty queue", () => {
    const { result } = renderHook(() => useSyncQueue());
    expect(result.current.syncQueue).toEqual([]);
  });

  it("should append diffs when calling queueSyncChanges", () => {
    const { result } = renderHook(() => useSyncQueue());

    act(() => {
      result.current.queueSyncChanges([mockDiff1]);
    });

    expect(result.current.syncQueue).toHaveLength(1);
    expect(result.current.syncQueue[0]).toEqual(mockDiff1);

    // Should append, not replace
    act(() => {
      result.current.queueSyncChanges([mockDiff2]);
    });

    expect(result.current.syncQueue).toHaveLength(2);
    expect(result.current.syncQueue[1]).toEqual(mockDiff2);
  });

  it("should remove a specific change by ID", () => {
    const { result } = renderHook(() => useSyncQueue());

    act(() => {
      result.current.queueSyncChanges([mockDiff1, mockDiff2]);
    });

    act(() => {
      result.current.removeSyncChange("d1");
    });

    expect(result.current.syncQueue).toHaveLength(1);
    expect(result.current.syncQueue[0].id).toBe("d2"); // d1 removed
  });

  it("should clear all changes when clearSyncQueue is called", () => {
    const { result } = renderHook(() => useSyncQueue());

    act(() => {
      result.current.queueSyncChanges([mockDiff1, mockDiff2]);
    });

    act(() => {
      result.current.clearSyncQueue();
    });

    expect(result.current.syncQueue).toHaveLength(0);
  });
});
