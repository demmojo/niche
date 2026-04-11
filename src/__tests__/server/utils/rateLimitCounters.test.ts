import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, incrementRateLimitCounter } from "../../../server/utils/rateLimitCounters";

// Mock firebase-admin
vi.mock("firebase-admin", () => {
  const commitMock = vi.fn().mockResolvedValue(true);
  const updateMock = vi.fn();
  const setMock = vi.fn();
  const getMock = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ count: 5 }), // Some mocked value
  });

  const docMock = vi.fn().mockReturnValue({
    get: getMock,
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: getMock,
      }),
      get: getMock,
    }),
  });

  const collectionMock = vi.fn().mockReturnValue({
    doc: docMock,
    get: getMock,
  });

  const writeBatchMock = vi.fn().mockReturnValue({
    update: updateMock,
    set: setMock,
    commit: commitMock,
  });

  const firestoreMock = vi.fn().mockReturnValue({
    collection: collectionMock,
    batch: writeBatchMock,
  });

  // Assign FieldValue mock directly onto firestoreMock
  (firestoreMock as any).FieldValue = {
    increment: vi.fn().mockReturnValue({ isIncrement: true })
  };

  return {
    firestore: firestoreMock,
  };
});

describe("Phase 1: Tenant-scoped Firestore Distributed Counters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should distribute increments across multiple shard documents", async () => {
    const { firestore } = await import("firebase-admin");
    const db = firestore();
    
    await incrementRateLimitCounter("tenant-123");
    
    // It should use a write batch for atomic counter updates
    expect(db.batch).toHaveBeenCalled();
    
    const batchInstance = db.batch();
    // It should randomly select a shard between 0 and numShards
    expect(batchInstance.set).toHaveBeenCalledWith(
      expect.anything(), // Document reference
      expect.objectContaining({ count: expect.anything() }), // FieldValue.increment
      { merge: true }
    );
    expect(batchInstance.commit).toHaveBeenCalled();
  });

  it("should sum all shards to check if the rate limit is exceeded", async () => {
    // Override the mock to return specific shard counts
    const { firestore } = await import("firebase-admin");
    const db = firestore();
    const getDocsMock = vi.fn().mockResolvedValue({
      docs: [
        { data: () => ({ count: 5 }) },
        { data: () => ({ count: 4 }) },
        { data: () => ({ count: 2 }) },
      ]
    });
    
    db.collection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          get: getDocsMock
        })
      })
    }) as any;

    // Total count is 5 + 4 + 2 = 11
    // If limit is 10, it should return false (limit exceeded)
    const isAllowed = await checkRateLimit("tenant-123", 10);
    expect(isAllowed).toBe(false);

    // If limit is 15, it should return true
    const isAllowedHigherLimit = await checkRateLimit("tenant-123", 15);
    expect(isAllowedHigherLimit).toBe(true);
  });
});
