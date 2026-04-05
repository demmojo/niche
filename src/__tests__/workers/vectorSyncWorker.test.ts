import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@google-cloud/bigquery", () => {
  return {
    BigQuery: vi.fn().mockImplementation(() => ({
      query: queryMock,
    })),
  };
});

vi.mock("firebase-admin", () => {
  const mockSet = vi.fn();
  const mockDelete = vi.fn();
  const mockCommit = vi.fn().mockResolvedValue(true);
  const mockBatch = vi.fn(() => ({
    set: mockSet,
    delete: mockDelete,
    commit: mockCommit,
  }));
  const mockDoc = vi.fn(() => ({}));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));

  return {
    default: {
      firestore: Object.assign(
        vi.fn(() => ({
          collection: mockCollection,
          batch: mockBatch,
        })),
        {
          FieldValue: {
            vector: vi.fn((arr) => arr),
          },
        },
      ),
    },
    FieldValue: {
      vector: vi.fn((arr) => arr),
    },
  };
});

describe("vectorSyncWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should throw error if GCP_PROJECT_ID is missing", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "");
    const { processVectorSync } =
      await import("../../../src/server/workers/vectorSyncWorker");

    await expect(processVectorSync()).rejects.toThrow(
      "GCP_PROJECT_ID environment variable is required",
    );
  });

  it("should sync active records and tombstone inactive ones", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test-project");

    queryMock
      // first call: active records
      .mockResolvedValueOnce([
        [
          {
            domain: "active.com",
            core_features: "AI",
            target_audience: "Devs",
            valid_from: { value: "2023-01-01" },
            is_hyper_velocity_tarpit: true,
            engineering_to_sales_ratio: 2.5,
            integration_count: 15,
            indexation_size: 50000,
            sponsored_presence: true,
          },
        ],
      ])
      // second call: deleted records
      .mockResolvedValueOnce([[{ domain: "inactive.com" }]]);

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { processVectorSync } =
      await import("../../../src/server/workers/vectorSyncWorker");

    const result = await processVectorSync();

    expect(result.upserted).toBe(1);
    expect(result.deleted).toBe(1);
    expect(queryMock).toHaveBeenCalledTimes(2);

    consoleLogSpy.mockRestore();
  });

  it("should handle empty results gracefully", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test-project");

    queryMock.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { processVectorSync } =
      await import("../../../src/server/workers/vectorSyncWorker");

    const result = await processVectorSync();

    expect(result.upserted).toBe(0);
    expect(result.deleted).toBe(0);

    consoleLogSpy.mockRestore();
  });
});
