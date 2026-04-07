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
  const getMock = vi.fn().mockResolvedValue({
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

  return {
    default: {
      firestore: Object.assign(
        () => ({
          collection: () => ({
            doc: vi.fn((id) => ({
              id: id || "mock-doc-id",
              get: getMock,
              collection: () => ({
                doc: vi.fn((shardId) => ({ id: shardId })),
              }),
            })),
          }),
          batch: () => mockBatch,
        }),
        {
          FieldValue: {
            serverTimestamp: vi.fn(),
            increment: vi.fn(),
          },
        },
      ),
    },
  };
});

describe("Flywheel Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
