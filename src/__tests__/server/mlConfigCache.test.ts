import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mlConfigCache } from "../../server/mlConfigCache";
import admin from "firebase-admin";

vi.mock("firebase-admin", () => {
  const mockDocs = [
    {
      id: "variant-1",
      data: () => ({
        configId: "cfg-1",
        version: 1,
        status: "champion",
        tier: "Fast",
        mabWeight: 1.5,
      }),
    },
    {
      id: "variant-2",
      data: () => ({
        configId: "cfg-1",
        version: 2,
        status: "champion",
        tier: "Pro",
        mabWeight: 0.5,
      }),
    },
    {
      id: "variant-3",
      data: () => ({
        configId: "cfg-2", // Different configId
        version: 1,
        status: "champion",
        tier: "Lite",
        // mabWeight missing, should default to 1.0
      }),
    },
  ];

  const snapshot = {
    forEach: (cb: any) => mockDocs.forEach(cb),
    docs: mockDocs,
  };

  const collectionMock = vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(snapshot),
    add: vi.fn().mockResolvedValue({ id: "mock-id" }),
  }));

  return {
    default: {
      firestore: Object.assign(
        vi.fn(() => ({
          collection: collectionMock,
        })),
        {
          FieldValue: {
            serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
          },
        },
      ),
      apps: [],
      initializeApp: vi.fn(),
    },
    firestore: Object.assign(
      vi.fn(() => ({
        collection: collectionMock,
      })),
      {
        FieldValue: {
          serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
        },
      },
    ),
    apps: [],
    initializeApp: vi.fn(),
  };
});

describe("MLConfigCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mlConfigCache as any).cacheExpiry = 0;
    mlConfigCache.activeChampions.clear();
    mlConfigCache.mabWeightsCache.clear();
  });

  describe("route", () => {
    it("initializes via refreshCache on first route call", async () => {
      await mlConfigCache.route("cfg-1");

      expect(mlConfigCache.activeChampions.has("cfg-1")).toBe(true);
      expect(mlConfigCache.activeChampions.get("cfg-1")?.length).toBe(2);
      expect(mlConfigCache.mabWeightsCache.get("cfg-1")?.get("variant-1")).toBe(
        1.5,
      );
      expect(mlConfigCache.mabWeightsCache.get("cfg-1")?.get("variant-2")).toBe(
        0.5,
      );

      expect(mlConfigCache.activeChampions.has("cfg-2")).toBe(true);
      expect(mlConfigCache.mabWeightsCache.get("cfg-2")?.get("variant-3")).toBe(
        1.0,
      ); // Default weight
    });

    it("returns null for unknown configId", async () => {
      const result = await mlConfigCache.route("unknown-cfg");
      expect(result).toBeNull();
    });

    it("routes based on MAB weights using Thompson Sampling approximation", async () => {
      // For cfg-1: variant-1 weight is 1.5, variant-2 weight is 0.5
      // Total weight = 2.0. So 75% chance for variant-1, 25% for variant-2.

      vi.spyOn(Math, "random").mockReturnValue(0.5); // 0.5 * 2.0 = 1.0 < 1.5 -> variant-1
      const res1 = await mlConfigCache.route("cfg-1");
      expect(res1?.configId).toBe("variant-1");

      vi.spyOn(Math, "random").mockReturnValue(0.9); // 0.9 * 2.0 = 1.8 > 1.5 -> variant-2
      const res2 = await mlConfigCache.route("cfg-1");
      expect(res2?.configId).toBe("variant-2");
    });
  });

  describe("emitTelemetry", () => {
    it("emits telemetry to firestore correctly", async () => {
      const db = admin.firestore();
      const mockAdd = vi.fn().mockResolvedValue({ id: "new-doc" });
      vi.mocked(db.collection).mockReturnValue({
        add: mockAdd,
        where: vi.fn().mockReturnThis(),
        get: vi.fn(),
      } as any);

      await mlConfigCache.emitTelemetry({
        variantId: "var-1",
        configId: "cfg-1",
        durationMs: 100,
        inputLength: 50,
        success: true,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          variantId: "var-1",
          durationMs: 100,
        }),
      );
    });
  });
});
