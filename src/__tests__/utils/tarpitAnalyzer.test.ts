import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeProductForTarpit } from "../../utils/tarpitAnalyzer";
import { withModelFallback } from "../../utils/aiClient";

vi.mock("../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

describe("tarpitAnalyzer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully analyze a product and return valid result", async () => {
    const mockResult = {
      isTarpit: true,
      score: 85,
      reasoning: "Too horizontal and competitive.",
      suggestedNiches: ["Niche 1", "Niche 2"],
    };

    vi.mocked(withModelFallback).mockResolvedValue({
      text: JSON.stringify(mockResult),
    });

    const result = await analyzeProductForTarpit(
      "Generic CRM",
      "A CRM for everyone",
    );

    expect(result).toEqual(mockResult);
    expect(withModelFallback).toHaveBeenCalledTimes(1);
  });

  it("should return a fallback object if JSON parsing fails", async () => {
    vi.mocked(withModelFallback).mockResolvedValue({
      text: "not a json string",
    });

    const result = await analyzeProductForTarpit("Idea", "Desc");

    expect(result).toEqual({
      isTarpit: false,
      score: 0,
      reasoning: "Failed to analyze.",
      suggestedNiches: [],
    });
  });

  it("should return a fallback object if withModelFallback throws", async () => {
    vi.mocked(withModelFallback).mockRejectedValue(new Error("Network Error"));

    const result = await analyzeProductForTarpit("Idea", "Desc");

    expect(result).toEqual({
      isTarpit: false,
      score: 0,
      reasoning: "Failed to analyze.",
      suggestedNiches: [],
    });
  });
});
