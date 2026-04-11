import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkRateLimit,
  incrementRateLimitCounter,
  atomicRateLimitCheck,
} from "../../../server/utils/rateLimitCounters";

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
    runTransaction: vi.fn().mockImplementation(async (callback) => {
      const transactionMock = {
        get: vi.fn().mockImplementation((ref) => ref.get()),
        set: vi.fn(),
        update: vi.fn(),
      };
      return callback(transactionMock);
    }),
  });

  // Assign FieldValue mock directly onto firestoreMock
  (firestoreMock as any).FieldValue = {
    increment: vi.fn().mockReturnValue({ isIncrement: true }),
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
      { merge: true },
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
      ],
    });

    db.collection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          get: getDocsMock,
        }),
      }),
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

describe("Phase 1: Rate Limiting with Anonymous UID and IP Hashing (RED tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify both Anonymous UID and Application-level Hashed IP limits securely", async () => {
    // We expect atomicRateLimitCheck to now take an ipAddress parameter as well
    // and correctly hash the IP (e.g. IPv6 bucketed to /64, HMAC-SHA256 hashed with a pepper)
    // before checking the limits in Firestore.
    // Let's assert that it fails since the implementation isn't updated yet.

    const { firestore } = await import("firebase-admin");
    const db = firestore();

    // Mock the firestore reads to simulate the user being under the limit
    const getDocsMock = vi.fn().mockResolvedValue({
      docs: [{ data: () => ({ count: 0 }) }], // Under limit
    });

    const collectionMock = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          get: getDocsMock,
          doc: vi.fn().mockReturnValue({
            set: vi.fn().mockResolvedValue(true),
          }),
        }),
      }),
    });
    db.collection = collectionMock as any;

    // The function signature should be updated to accept IP address
    // This will cause a typescript/runtime error or fail the test since atomicRateLimitCheck
    // does not accept an IP address natively yet or doesn't hash it.
    // We'll pass a dummy IP and expect that the db.collection was called with a hashed IP.
    const ipAddress = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"; // IPv6 Address

    // @ts-ignore - simulating the new signature before implementation
    const isAllowed = await atomicRateLimitCheck("anon-uid-123", 5, ipAddress);

    expect(isAllowed).toBe(true);

    // We expect the IP to be hashed, so it shouldn't use the raw IP directly in any collection path
    const calls = collectionMock.mock.calls;
    const ipCalls = calls.filter((call) => call[0] === "rate_limits_ip");

    expect(ipCalls.length).toBeGreaterThan(0); // Should check IP limits
    // Ensure the raw IP is NOT used (it must be hashed)
    const docCalls = db.collection("rate_limits_ip")
      .doc as unknown as ReturnType<typeof vi.fn>;
    // The first call to docMock is for tenantId, the second is for IP
    const docArg = docCalls.mock.calls[1][0];
    expect(docArg).not.toBe(ipAddress);
    expect(docArg.length).toBeGreaterThan(32); // Expecting a long hash (SHA256 hex is 64 chars)
  });
});
