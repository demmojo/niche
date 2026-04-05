import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkAndIncrementAnonymousLimit,
  checkAndIncrementGlobalAnonymousLimit,
} from "../../../server/utils/anonymousUsage";
import admin from "firebase-admin";

// Mock Firebase Admin
vi.mock("firebase-admin", () => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const getAllMock = vi.fn();
  const docRefMock = { id: "test-hash" };

  const transactionMock = {
    get: getMock,
    set: setMock,
    getAll: getAllMock,
  };

  const runTransactionMock = vi.fn().mockImplementation(async (callback) => {
    return callback(transactionMock);
  });

  const docMock = vi.fn((id: string) => ({ id }));
  const collectionMock = vi.fn(() => ({
    doc: docMock,
  }));

  const firestoreMock = Object.assign(
    vi.fn(() => ({
      collection: collectionMock,
      runTransaction: runTransactionMock,
    })),
    {
      FieldValue: {
        serverTimestamp: vi.fn(() => "mock-timestamp"),
      },
    },
  );

  return {
    default: {
      firestore: firestoreMock,
    },
    firestore: firestoreMock,
  };
});

describe("checkAndIncrementGlobalAnonymousLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true and create doc with count 1 if not exists", async () => {
    const db = admin.firestore();
    const mockTransactionGetAllLocal = vi.fn().mockResolvedValue(
      Array.from({ length: 10 }).map(() => ({
        exists: false,
        data: () => undefined,
      })),
    );
    const mockTransactionSetLocal = vi.fn();

    vi.mocked(db.runTransaction).mockImplementationOnce(async (callback) => {
      return callback({
        getAll: mockTransactionGetAllLocal,
        set: mockTransactionSetLocal,
      } as any);
    });

    const result = await checkAndIncrementGlobalAnonymousLimit(30);

    expect(result).toBe(true);
    const date = new Date().toISOString().split("T")[0];
    expect(mockTransactionSetLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(
          new RegExp(`anonymous_daily_${date}_shard_\\d+`),
        ),
      }),
      { count: 1, lastUpdatedAt: "mock-timestamp" },
      { merge: true },
    );
  });

  it("should return true and increment count if count < limit", async () => {
    const db = admin.firestore();
    const mockTransactionGetAllLocal = vi.fn().mockResolvedValue(
      Array.from({ length: 10 }).map((_, i) => ({
        exists: true,
        data: () => ({ count: i === 0 ? 29 : 0 }), // Total count = 29
      })),
    );
    const mockTransactionSetLocal = vi.fn();

    vi.mocked(db.runTransaction).mockImplementationOnce(async (callback) => {
      return callback({
        getAll: mockTransactionGetAllLocal,
        set: mockTransactionSetLocal,
      } as any);
    });

    const result = await checkAndIncrementGlobalAnonymousLimit(30);

    expect(result).toBe(true);
    const date = new Date().toISOString().split("T")[0];
    expect(mockTransactionSetLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(
          new RegExp(`anonymous_daily_${date}_shard_\\d+`),
        ),
      }),
      expect.objectContaining({ lastUpdatedAt: "mock-timestamp" }), // count will be either 30 or 1 depending on shard
      { merge: true },
    );
  });

  it("should return false if count >= limit", async () => {
    const db = admin.firestore();
    const mockTransactionGetAllLocal = vi.fn().mockResolvedValue(
      Array.from({ length: 10 }).map((_, i) => ({
        exists: true,
        data: () => ({ count: i === 0 ? 30 : 0 }), // Total count = 30
      })),
    );
    const mockTransactionSetLocal = vi.fn();

    vi.mocked(db.runTransaction).mockImplementationOnce(async (callback) => {
      return callback({
        getAll: mockTransactionGetAllLocal,
        set: mockTransactionSetLocal,
      } as any);
    });

    const result = await checkAndIncrementGlobalAnonymousLimit(30);

    expect(result).toBe(false);
    expect(mockTransactionSetLocal).not.toHaveBeenCalled();
  });

  it("should return false if transaction throws", async () => {
    const db = admin.firestore();
    vi.mocked(db.runTransaction).mockRejectedValueOnce(
      new Error("Transaction failed"),
    );

    const result = await checkAndIncrementGlobalAnonymousLimit(30);

    expect(result).toBe(false);
  });
});

describe("checkAndIncrementAnonymousLimit", () => {
  const mockTransactionGet = vi.mocked(
    (admin.firestore().runTransaction as any).mock.calls.length > 0
      ? (admin.firestore().runTransaction as any).mock.calls[0][0].get
      : vi.fn(),
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true and create doc with count 1 if not exists", async () => {
    // We need to mock the transaction.get to return !exists
    const db = admin.firestore();
    const mockTransactionGetLocal = vi.fn().mockResolvedValue({
      exists: false,
      data: () => undefined,
    });
    const mockTransactionSetLocal = vi.fn();

    vi.mocked(db.runTransaction).mockImplementationOnce(async (callback) => {
      return callback({
        get: mockTransactionGetLocal,
        set: mockTransactionSetLocal,
      } as any);
    });

    const result = await checkAndIncrementAnonymousLimit("hash123");

    expect(result).toBe(true);
    expect(mockTransactionSetLocal).toHaveBeenCalledWith(
      { id: "hash123" },
      { count: 1, lastUsedAt: "mock-timestamp" },
      { merge: true },
    );
  });

  it("should return true and increment count if count < limit", async () => {
    const db = admin.firestore();
    const mockTransactionGetLocal = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ count: 2 }),
    });
    const mockTransactionSetLocal = vi.fn();

    vi.mocked(db.runTransaction).mockImplementationOnce(async (callback) => {
      return callback({
        get: mockTransactionGetLocal,
        set: mockTransactionSetLocal,
      } as any);
    });

    const result = await checkAndIncrementAnonymousLimit("hash123", 3);

    expect(result).toBe(true);
    expect(mockTransactionSetLocal).toHaveBeenCalledWith(
      { id: "hash123" },
      { count: 3, lastUsedAt: "mock-timestamp" },
      { merge: true },
    );
  });

  it("should return false if count >= limit", async () => {
    const db = admin.firestore();
    const mockTransactionGetLocal = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ count: 3 }),
    });
    const mockTransactionSetLocal = vi.fn();

    vi.mocked(db.runTransaction).mockImplementationOnce(async (callback) => {
      return callback({
        get: mockTransactionGetLocal,
        set: mockTransactionSetLocal,
      } as any);
    });

    const result = await checkAndIncrementAnonymousLimit("hash123", 3);

    expect(result).toBe(false);
    expect(mockTransactionSetLocal).not.toHaveBeenCalled();
  });

  it("should return false if transaction throws", async () => {
    const db = admin.firestore();
    vi.mocked(db.runTransaction).mockRejectedValueOnce(
      new Error("Transaction failed"),
    );

    const result = await checkAndIncrementAnonymousLimit("hash123");

    expect(result).toBe(false);
  });
});
