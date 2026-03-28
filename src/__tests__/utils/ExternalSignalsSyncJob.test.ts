import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExternalSignalsSyncJob } from "../../utils/ExternalSignalsSyncJob";
import * as aiClient from "../../utils/aiClient";
import * as apiKeys from "../../utils/apiKeys";
import { MyProductData } from "../../components/MyProduct";

vi.mock("../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

vi.mock("../../utils/apiKeys", () => ({
  getCustomApiKey: vi.fn(),
}));

describe("ExternalSignalsSyncJob", () => {
  const mockCompetitor = { id: "comp-1", name: "TestCompetitor" };
  const mockProduct: MyProductData = {
    name: "Test Product",
    description: "A test product for tests",
    targetRegions: [],
    features: [],
    strategy: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("syncCompetitorSentiment", () => {
    it("skips sync if Exa API key is missing", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue(null);
      const originalEnv = process.env.VITE_EXA_API_KEY_SECONDARY;
      delete process.env.VITE_EXA_API_KEY_SECONDARY;

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncCompetitorSentiment([
        mockCompetitor,
      ] as any);

      expect(insights).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();

      process.env.VITE_EXA_API_KEY_SECONDARY = originalEnv;
    });

    it("handles fetch failure gracefully", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncCompetitorSentiment([
        mockCompetitor,
      ] as any);

      expect(insights).toEqual([]);
      expect(global.fetch).toHaveBeenCalled();
      expect(aiClient.withModelFallback).not.toHaveBeenCalled();
    });

    it("parses AI output and returns sentiment insights", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ text: "Too expensive", title: "Review 1" }],
        }),
      });

      (aiClient.withModelFallback as any).mockResolvedValue({
        text: JSON.stringify({
          results: [
            {
              featureName: "Pricing",
              prevalenceScore: 0.8,
              dissatisfactionScore: 0.9,
              confidenceScore: 0.95,
              verbatimQuotes: ["Too expensive"],
            },
          ],
        }),
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncCompetitorSentiment([
        mockCompetitor,
      ] as any);

      expect(insights).toHaveLength(1);
      expect(insights[0].competitorId).toBe("comp-1");
      expect(insights[0].featureName).toBe("Pricing");
      expect(insights[0].prevalenceScore).toBe(0.8);
      expect(insights[0].dissatisfactionScore).toBe(0.9);
    });

    it("handles AI parsing errors gracefully", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      (aiClient.withModelFallback as any).mockResolvedValue({
        text: "invalid json {",
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncCompetitorSentiment([
        mockCompetitor,
      ] as any);

      expect(insights).toEqual([]);
    });

    it("handles general errors in the loop", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncCompetitorSentiment([
        mockCompetitor,
      ] as any);

      expect(insights).toEqual([]);
    });
  });

  describe("syncMarketIntent", () => {
    it("skips sync if Exa API key is missing", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue(null);
      const originalEnv = process.env.VITE_EXA_API_KEY_SECONDARY;
      delete process.env.VITE_EXA_API_KEY_SECONDARY;

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncMarketIntent(mockProduct);

      expect(insights).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();

      process.env.VITE_EXA_API_KEY_SECONDARY = originalEnv;
    });

    it("handles fetch failure gracefully", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncMarketIntent(mockProduct);

      expect(insights).toEqual([]);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("parses AI output and returns JTBD insights", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ text: "How do I do X", title: "Forum post" }],
        }),
      });

      (aiClient.withModelFallback as any).mockResolvedValue({
        text: JSON.stringify({
          results: [
            {
              jobStatement: "Do X efficiently",
              importanceScore: 8,
              currentSatisfactionScore: 3,
              confidenceScore: 0.9,
              verbatimQuotes: ["How do I do X"],
            },
          ],
        }),
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncMarketIntent(mockProduct);

      expect(insights).toHaveLength(1);
      expect(insights[0].jobStatement).toBe("Do X efficiently");
      expect(insights[0].importanceScore).toBe(8);
      expect(insights[0].currentSatisfactionScore).toBe(3);
      expect(insights[0].opportunityScore).toBe(13); // 8 + (8-3)
    });

    it("handles missing AI output properties gracefully", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [],
        }),
      });

      (aiClient.withModelFallback as any).mockResolvedValue({
        text: JSON.stringify({
          results: [
            {
              jobStatement: "Missing scores",
              // Missing importanceScore, currentSatisfactionScore
            },
          ],
        }),
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncMarketIntent(mockProduct);

      expect(insights).toHaveLength(1);
      expect(insights[0].importanceScore).toBe(5); // Default
      expect(insights[0].currentSatisfactionScore).toBe(5); // Default
      expect(insights[0].opportunityScore).toBe(5); // 5 + 0
    });

    it("handles AI parsing errors gracefully", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      (aiClient.withModelFallback as any).mockResolvedValue({
        text: "invalid json {",
      });

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncMarketIntent(mockProduct);

      expect(insights).toEqual([]);
    });

    it("handles general errors in the loop", async () => {
      vi.spyOn(apiKeys, "getCustomApiKey").mockReturnValue("fake-key");
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const job = new ExternalSignalsSyncJob();
      const insights = await job.syncMarketIntent(mockProduct);

      expect(insights).toEqual([]);
    });
  });
});
