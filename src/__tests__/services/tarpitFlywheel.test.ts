import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runTarpitClustering,
  storeTarpitQuery,
} from "../../services/tarpitFlywheel";
import { supabase } from "../../utils/hashing";
import { Piscina } from "piscina";

// Mock Supabase
vi.mock("../../utils/hashing", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  },
}));

// Mock Piscina
vi.mock("piscina", () => {
  return {
    Piscina: vi.fn().mockImplementation(() => ({
      run: vi.fn().mockResolvedValue({
        silhouette_coefficient: 0.85,
        centroids: [],
      }),
    })),
  };
});

describe("tarpitFlywheel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runTarpitClustering", () => {
    it("should fetch data and trigger clustering worker", async () => {
      const mockData = [
        { query_vector: "[0.1, 0.2]" },
        { query_vector: [0.3, 0.4] },
        { query_vector: "invalid-json" }, // Should skip/handle gracefully
      ];

      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }));

      const result = await runTarpitClustering();

      expect(supabase.from).toHaveBeenCalledWith("tarpit_queries");
      expect(result).toEqual({
        silhouette_coefficient: 0.85,
        centroids: [],
      });
    });

    it("should return early if no data or error occurs", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue({ data: null, error: new Error("DB error") }),
      }));

      const result = await runTarpitClustering();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "No tarpit queries to cluster",
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("storeTarpitQuery", () => {
    it("should insert query correctly", async () => {
      (supabase.from as any).mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }));

      await storeTarpitQuery("user-1", "test query", [0.1, 0.2]);

      expect(supabase.from).toHaveBeenCalledWith("tarpit_queries");
    });

    it("should log error if insert fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (supabase.from as any).mockImplementation(() => ({
        insert: vi
          .fn()
          .mockResolvedValue({ error: new Error("Insert failed") }),
      }));

      await storeTarpitQuery("user-1", "test query", [0.1, 0.2]);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to store tarpit query:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
