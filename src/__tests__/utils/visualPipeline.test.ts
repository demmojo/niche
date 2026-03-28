import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeVisuals,
  runOmniParser,
  extractFeaturesFromVisuals,
} from "../../utils/visualPipeline";
import { withModelFallback } from "../../utils/aiClient";
import * as imageUtils from "../../utils/imageUtils";

vi.mock("../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

vi.mock("../../utils/imageUtils", () => ({
  downscaleImageBase64: vi.fn((img) => img),
}));

describe("visualPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runOmniParser", () => {
    it("should return mocked bounding boxes", async () => {
      const result = await runOmniParser("fake-base64");
      expect(result.elements).toHaveLength(3);
      expect(result.elements[0].id).toBe("btn-signup");
    });
  });

  describe("extractFeaturesFromVisuals", () => {
    it("should extract features when LLM returns valid JSON", async () => {
      const mockFeatures = [
        {
          name: "One-Click Onboarding",
          confidence: 0.95,
          boundingBoxId: "btn-signup",
          competitiveImportanceScore: 85,
          reasoning: "Important",
        },
      ];

      vi.mocked(withModelFallback).mockResolvedValue({
        text: JSON.stringify(mockFeatures),
      });

      const result = await extractFeaturesFromVisuals("fake-base64", {
        elements: [],
      });

      expect(result).toEqual(mockFeatures);
      expect(withModelFallback).toHaveBeenCalledTimes(1);
    });

    it("should return empty array on invalid JSON", async () => {
      vi.mocked(withModelFallback).mockResolvedValue({
        text: "invalid json",
      });

      const result = await extractFeaturesFromVisuals("fake-base64", {
        elements: [],
      });

      expect(result).toEqual([]);
    });

    it("should return empty array when LLM throws", async () => {
      vi.mocked(withModelFallback).mockRejectedValue(new Error("API Error"));

      const result = await extractFeaturesFromVisuals("fake-base64", {
        elements: [],
      });

      expect(result).toEqual([]);
    });
  });

  describe("analyzeVisuals", () => {
    it("should orchestrate omniParser and feature extraction", async () => {
      const mockFeatures = [
        {
          name: "Pricing Link",
          confidence: 0.9,
          boundingBoxId: "nav-pricing",
          competitiveImportanceScore: 70,
          reasoning: "Key navigation",
        },
      ];

      vi.mocked(withModelFallback).mockResolvedValue({
        text: JSON.stringify(mockFeatures),
      });

      const result = await analyzeVisuals("fake-base64", "anthropic");

      expect(result.omniParser.elements).toHaveLength(3);
      expect(result.features).toEqual(mockFeatures);
      expect(result.proxyInfo).toEqual({
        downscaled: true,
        provider: "anthropic",
      });
      expect(imageUtils.downscaleImageBase64).toHaveBeenCalledWith(
        "fake-base64",
      );
    });
  });
});
