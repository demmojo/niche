import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runTarpitClustering,
  storeTarpitQuery,
} from "../../services/tarpitFlywheel";
import { supabase } from "../../utils/hashing";
import streamingSphericalKMeans from "../../workers/kmeansWorker";

// Hoist mocks to use them inside vi.mock
const { mockLimit, mockSelect, mockInsert, mockFrom } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockSelect = vi.fn(() => ({ limit: mockLimit }));
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ select: mockSelect, insert: mockInsert }));
  return { mockLimit, mockSelect, mockInsert, mockFrom };
});

vi.mock("../../utils/hashing", () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock("../../workers/kmeansWorker", () => ({
  default: vi.fn(),
}));

describe("tarpitFlywheel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs/warns/errors to keep test output clean
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("runTarpitClustering", () => {
    it("should return early and warn if supabase returns an error", async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: new Error("DB Error"),
      });

      const result = await runTarpitClustering();

      expect(mockFrom).toHaveBeenCalledWith("tarpit_queries");
      expect(mockSelect).toHaveBeenCalledWith("query_vector");
      expect(mockLimit).toHaveBeenCalledWith(1000);
      expect(console.warn).toHaveBeenCalledWith(
        "No tarpit queries to cluster",
        expect.any(Error),
      );
      expect(result).toBeUndefined();
      expect(streamingSphericalKMeans).not.toHaveBeenCalled();
    });

    it("should return early and warn if supabase returns null data", async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });

      const result = await runTarpitClustering();

      expect(console.warn).toHaveBeenCalledWith(
        "No tarpit queries to cluster",
        null,
      );
      expect(result).toBeUndefined();
      expect(streamingSphericalKMeans).not.toHaveBeenCalled();
    });

    it("should return early and warn if supabase returns empty data array", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const result = await runTarpitClustering();

      expect(console.warn).toHaveBeenCalledWith(
        "No tarpit queries to cluster",
        null,
      );
      expect(result).toBeUndefined();
      expect(streamingSphericalKMeans).not.toHaveBeenCalled();
    });

    it("should process valid vectors (arrays and JSON strings) and call streamingSphericalKMeans", async () => {
      const mockResult = { centroids: [0.1, 0.2], silhouette_coefficient: 0.8 };
      vi.mocked(streamingSphericalKMeans).mockResolvedValueOnce(
        mockResult as any,
      );

      // Create test vectors
      const vec1 = new Array(768).fill(1); // Array format
      const vec2 = new Array(768).fill(2); // String format

      mockLimit.mockResolvedValueOnce({
        data: [{ query_vector: vec1 }, { query_vector: JSON.stringify(vec2) }],
        error: null,
      });

      const result = await runTarpitClustering();

      // Check KMeans was called with correct data
      expect(streamingSphericalKMeans).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(streamingSphericalKMeans).mock.calls[0][0];

      expect(callArgs.numVectors).toBe(2);
      expect(callArgs.k).toBe(5);
      expect(callArgs.dim).toBe(768);
      expect(callArgs.buffer).toBeInstanceOf(ArrayBuffer);

      // Verify the buffer was populated correctly
      const view = new Float32Array(callArgs.buffer);
      expect(view[0]).toBe(1); // First element of vec1
      expect(view[768]).toBe(2); // First element of vec2

      expect(console.log).toHaveBeenCalledWith(
        "Clustering completed. Silhouette Score:",
        0.8,
      );
      expect(result).toBe(mockResult);
    });

    it("should handle invalid JSON strings gracefully by continuing", async () => {
      const mockResult = { centroids: [], silhouette_coefficient: 0.5 };
      vi.mocked(streamingSphericalKMeans).mockResolvedValueOnce(
        mockResult as any,
      );

      const vec1 = new Array(768).fill(1);

      mockLimit.mockResolvedValueOnce({
        data: [{ query_vector: "invalid json string" }, { query_vector: vec1 }],
        error: null,
      });

      const result = await runTarpitClustering();

      expect(streamingSphericalKMeans).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(streamingSphericalKMeans).mock.calls[0][0];
      const view = new Float32Array(callArgs.buffer);

      // The invalid row (index 0) should be all 0s
      expect(view[0]).toBe(0);

      // The valid row (index 1) should be 1s
      expect(view[768]).toBe(1);

      expect(result).toBe(mockResult);
    });

    it("should handle missing vector dimensions by padding with 0", async () => {
      const mockResult = { centroids: [], silhouette_coefficient: 0.5 };
      vi.mocked(streamingSphericalKMeans).mockResolvedValueOnce(
        mockResult as any,
      );

      // Vector shorter than 768
      const shortVec = [1, 2, 3];

      mockLimit.mockResolvedValueOnce({
        data: [{ query_vector: shortVec }],
        error: null,
      });

      await runTarpitClustering();

      const callArgs = vi.mocked(streamingSphericalKMeans).mock.calls[0][0];
      const view = new Float32Array(callArgs.buffer);

      expect(view[0]).toBe(1);
      expect(view[1]).toBe(2);
      expect(view[2]).toBe(3);
      expect(view[3]).toBe(0); // Padded with 0
      expect(view[767]).toBe(0); // Padded with 0
    });
  });

  describe("storeTarpitQuery", () => {
    it("should successfully insert a query", async () => {
      mockInsert.mockResolvedValueOnce({ error: null });

      const userId = "user123";
      const queryText = "how to build a crm";
      const vector = [0.1, 0.2, 0.3];

      await storeTarpitQuery(userId, queryText, vector);

      expect(mockFrom).toHaveBeenCalledWith("tarpit_queries");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        query_text: queryText,
        query_vector: vector,
      });
      expect(console.error).not.toHaveBeenCalled();
    });

    it("should log an error if insertion fails", async () => {
      const dbError = new Error("Insert failed");
      mockInsert.mockResolvedValueOnce({ error: dbError });

      await storeTarpitQuery("user123", "query", [0.1]);

      expect(console.error).toHaveBeenCalledWith(
        "Failed to store tarpit query:",
        dbError,
      );
    });
  });
});
