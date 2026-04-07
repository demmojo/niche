import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFlywheelCacheJitJob } from "../../../server/workers/flywheelWorker";
import admin from "firebase-admin";

const mockBatch = {
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue([]),
};

vi.mock("firebase-admin", () => {
  const firestoreMock = () => ({
    collection: () => ({
      doc: vi.fn((id) => ({
        id: id || "mock-doc-id",
        get: (globalThis as any).__FIRESTORE_PAYLOAD_GET__,
        collection: () => ({
          doc: vi.fn((shardId) => ({ id: shardId })),
        }),
      })),
    }),
    batch: () => mockBatch,
  });

  return {
    default: {
      firestore: Object.assign(firestoreMock, {
        FieldValue: {
          serverTimestamp: vi.fn(),
          increment: vi.fn(),
        },
      }),
    },
  };
});

describe("Flywheel Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__FIRESTORE_PAYLOAD_GET__ = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        idea: "AI for legal",
        competitors: [
          {
            domain: "www.LegalAi.com/foo",
            is_hyper_velocity_tarpit: true,
            core_features: ["doc review"],
          },
        ],
        userId: "test-user",
        timestamp: "2024-04-06T12:00:00Z",
      }),
    });
  });

  it("should return early if payloadDocId is missing", async () => {
    const result = await processFlywheelCacheJitJob({});
    expect(result.status).toBe("skipped");
  });

  it("should retrieve payload, write batch, and return completed", async () => {
    const result = await processFlywheelCacheJitJob({
      payloadDocId: "test-payload",
    });

    expect(result.status).toBe("completed");
    expect(mockBatch.set).toHaveBeenCalledTimes(3); // Query, Centroid, and Shard
    expect(mockBatch.delete).toHaveBeenCalledTimes(1);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);

    // Normalization check: www.LegalAi.com/foo should become legalai.com
    const setCall = mockBatch.set.mock.calls.find(
      (call) => call[0].id === "legalai.com",
    );
    expect(setCall).toBeDefined();
  });

  it("should return completed but skip processing if payloadDoc does not exist", async () => {
    (globalThis as any).__FIRESTORE_PAYLOAD_GET__ = vi.fn().mockResolvedValue({
      exists: false,
    });
    const result = await processFlywheelCacheJitJob({
      payloadDocId: "test-payload",
    });
    expect(result.status).toBe("completed");
    expect(result.reason).toBe("Payload already processed or deleted");
  });

  it("should return skipped if payload is invalid (missing competitors)", async () => {
    (globalThis as any).__FIRESTORE_PAYLOAD_GET__ = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ idea: "AI for legal" }),
    });
    const result = await processFlywheelCacheJitJob({
      payloadDocId: "test-payload",
    });
    expect(result.status).toBe("skipped");
    expect(result.reason).toBe("Invalid payload format");
  });

  it("should handle completely invalid domains gracefully using the fallback", async () => {
    (globalThis as any).__FIRESTORE_PAYLOAD_GET__ = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        idea: "AI for legal",
        competitors: [{ domain: "::malformed::" }],
        userId: "test-user",
      }),
    });
    const result = await processFlywheelCacheJitJob({
      payloadDocId: "test-payload",
    });
    expect(result.status).toBe("completed");

    // It should have stripped non-alphanumeric chars or fallback
    // Fallback logic: input.toLowerCase().trim().replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "")
    // "::malformed::" -> "malformed"
    const setCall = mockBatch.set.mock.calls.find(
      (call) => call[0].id === "malformed",
    );
    expect(setCall).toBeDefined();
  });
});
