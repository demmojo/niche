import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runLensDeepAnalysis,
  generateLensChatResponse,
} from "../../services/lensAiService";
import { withModelFallback } from "../../utils/aiClient";
import { LensContext } from "../../services/lensAiService";

vi.mock("../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

describe("lensAiService", () => {
  let mockContext: LensContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      stats: {
        tracked: 10,
        pricingChanges: 2,
        featuresIndexed: 50,
        topIntegrations: "Slack, Teams",
      },
      competitors: [],
      insights: [],
      rawData: [],
      rejectedSuggestions: [],
      chatHistory: [],
    };
  });

  describe("runLensDeepAnalysis", () => {
    it("should parse valid JSON response successfully", async () => {
      const validResponse = {
        message: "Analysis complete.",
        options: ["Option 1"],
        suggestions: [
          {
            type: "feature",
            title: "New Feature",
            description: "Desc",
            rationale: "Rationale",
            confidence: "High",
          },
        ],
      };

      vi.mocked(withModelFallback).mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      } as any);

      const result = await runLensDeepAnalysis(mockContext);
      expect(result).toEqual(validResponse);
      expect(withModelFallback).toHaveBeenCalled();
    });

    it("should handle markdown code blocks in JSON response", async () => {
      const validResponse = {
        message: "Analysis complete.",
        options: ["Option 1"],
        suggestions: [],
      };

      vi.mocked(withModelFallback).mockResolvedValueOnce({
        text: `\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``,
      } as any);

      const result = await runLensDeepAnalysis(mockContext);
      expect(result).toEqual(validResponse);
    });

    it("should handle parsing errors gracefully", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(withModelFallback).mockResolvedValueOnce({
        text: "Invalid JSON",
      } as any);

      const result = await runLensDeepAnalysis(mockContext);
      expect(result.message).toBe(
        "An error occurred while processing the market data.",
      );
      expect(result.options).toEqual(["Retry analysis"]);
      expect(result.suggestions).toEqual([]);
    });

    it("should handle missing text in response gracefully", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(withModelFallback).mockResolvedValueOnce({
        text: "",
      } as any);

      const result = await runLensDeepAnalysis(mockContext);
      expect(result.message).toBe(
        "An error occurred while processing the market data.",
      );
    });
  });

  describe("generateLensChatResponse", () => {
    it("should parse valid JSON response successfully", async () => {
      const validResponse = {
        message: "Here is your answer.",
        options: ["Follow up 1"],
        suggestions: [],
      };

      vi.mocked(withModelFallback).mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      } as any);

      const result = await generateLensChatResponse(mockContext, "Hello Lens");
      expect(result).toEqual(validResponse);
      expect(withModelFallback).toHaveBeenCalled();
    });

    it("should construct prompt with rejected history and chat history", async () => {
      mockContext.rejectedSuggestions = [
        {
          itemTitle: "Bad Feature",
          reason: "Too expensive",
          timestamp: 0,
        },
      ];
      mockContext.chatHistory = [
        { id: "1", role: "user", text: "Hello" },
        { id: "2", role: "lens", text: "Hi" },
      ];

      vi.mocked(withModelFallback).mockResolvedValueOnce({
        text: `{"message":"ok","options":[]}`,
      } as any);

      await generateLensChatResponse(mockContext, "What about X?");

      const callArgs = vi.mocked(withModelFallback).mock.calls[0][0] as any;

      // withModelFallback takes (ai, model) => Promise
      // We can intercept the inner call by executing the callback with a mock AI
      const mockGenerateContent = vi.fn().mockResolvedValue({ text: "{}" });
      const mockAi = { generateContent: mockGenerateContent };
      await callArgs(mockAi, "model-name");

      const promptArg = mockGenerateContent.mock.calls[0][1].contents;
      expect(promptArg).toContain(
        "- Rejected 'Bad Feature' because: Too expensive",
      );
      expect(promptArg).toContain("USER: Hello");
      expect(promptArg).toContain("LENS: Hi");
    });
  });
});
