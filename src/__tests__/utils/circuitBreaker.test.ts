import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { recordExaFailure, isExaTripped } from "../../utils/circuitBreaker";
import admin from "firebase-admin";

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockDoc = vi.fn(() => ({
  get: mockGet,
  update: mockUpdate,
}));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));

vi.mock("firebase-admin", () => {
  const mGet = vi.fn();
  const mUpdate = vi.fn().mockResolvedValue(true);
  const mSet = vi.fn();
  const mDoc = vi.fn(() => ({
    get: mGet,
    update: mUpdate,
  }));
  const mCollection = vi.fn(() => ({ doc: mDoc }));

  const mockDb = {
    collection: mCollection,
    runTransaction: vi.fn(async (cb) => {
      return cb({
        get: mGet,
        set: mSet,
        update: mUpdate,
      });
    }),
  };

  return {
    default: {
      firestore: vi.fn(() => mockDb),
    },
    firestore: vi.fn(() => mockDb),
    __mGet: mGet,
    __mUpdate: mUpdate,
    __mSet: mSet,
    __mDoc: mDoc,
    __mCollection: mCollection,
  };
});

const mAdmin = (await import("firebase-admin")) as any;

describe("circuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not be tripped initially", async () => {
    mAdmin.__mGet.mockResolvedValue({ exists: false });
    const result = await isExaTripped();
    expect(result).toBe(false);
  });

  it("should trip after 3 failures in a short window", async () => {
    mAdmin.__mGet.mockResolvedValueOnce({ exists: false });
    await recordExaFailure();

    mAdmin.__mGet.mockResolvedValue({
      exists: true,
      data: () => ({ failureCount: 3, lastFailureTimestamp: Date.now() }),
    });

    const tripped = await isExaTripped();
    expect(tripped).toBe(true);
  });

  it("should reset after window expires", async () => {
    const past = Date.now() - (5 * 60 * 1000 + 100); // More than 5 minutes ago
    mAdmin.__mGet.mockResolvedValue({
      exists: true,
      data: () => ({ failureCount: 3, lastFailureTimestamp: past }),
    });

    const tripped = await isExaTripped();
    expect(tripped).toBe(false);
    expect(mAdmin.__mUpdate).toHaveBeenCalledWith({
      failureCount: 0,
    });
  });

  it("should reset count if failures are far apart", async () => {
    const past = Date.now() - (5 * 60 * 1000 + 100);
    mAdmin.__mGet.mockResolvedValue({
      exists: true,
      data: () => ({ failureCount: 1, lastFailureTimestamp: past }),
    });

    await recordExaFailure();
    expect(mAdmin.__mSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ failureCount: 1 }),
    );
  });
});
