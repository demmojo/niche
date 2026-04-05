import { describe, it, expect } from "vitest";
import { calculateHeuristicScores } from "../../server/scoringHeuristics";
import { Competitor } from "../../types";

describe("calculateHeuristicScores", () => {
  it("should return baseline scores with empty input", () => {
    const result = calculateHeuristicScores({});

    // Baseline trust is 50, but since spamProtection is undefined, it subtracts 15 -> 35
    expect(result.trustScore).toBe(35);

    // Baseline competitorScore is 50. No free tier -> 50. No features -> 50
    expect(result.competitorScore).toBe(50);

    // Confidence calc based on trust score 35
    const expTrust = Math.exp(35 / 100);
    const expectedConfidence = expTrust / (expTrust + Math.exp(1 - 35 / 100));
    expect(result.confidenceThreshold).toBeCloseTo(expectedConfidence, 5);
  });

  it("should increase competitorScore if has_free_tier is true", () => {
    const result = calculateHeuristicScores({ has_free_tier: true });
    expect(result.competitorScore).toBe(60);
  });

  it("should increase competitorScore if freeTier is true", () => {
    const result = calculateHeuristicScores({ freeTier: true } as any);
    expect(result.competitorScore).toBe(60);
  });

  it("should increase trustScore if spamProtection is present and not 'no'", () => {
    const result = calculateHeuristicScores({ spamProtection: "Yes" } as any);
    // Baseline 50 + 20 = 70
    expect(result.trustScore).toBe(70);
  });

  it("should decrease trustScore if spamProtection is 'no' (case insensitive)", () => {
    const result = calculateHeuristicScores({ spamProtection: "No" } as any);
    // Baseline 50 - 15 = 35
    expect(result.trustScore).toBe(35);
  });

  it("should accumulate weights for known features", () => {
    const result = calculateHeuristicScores({
      coreFeatures: ["SSO", "API", "Webhooks", "Custom Domains", "Audit Logs"],
    } as any);

    // Total weight = 15 + 10 + 8 + 12 + 20 = 65
    // competitorScore = 50 + Math.log1p(65) * 5
    const expectedScore = Math.round(50 + Math.log1p(65) * 5);
    expect(result.competitorScore).toBe(expectedScore);
  });

  it("should use default weight 5 for unknown features", () => {
    const result = calculateHeuristicScores({
      coreFeatures: ["UnknownFeature1", "UnknownFeature2"],
    } as any);

    // Total weight = 5 + 5 = 10
    // competitorScore = 50 + Math.log1p(10) * 5
    const expectedScore = Math.round(50 + Math.log1p(10) * 5);
    expect(result.competitorScore).toBe(expectedScore);
  });

  it("should handle a mix of inputs and cap max scores at 100", () => {
    const features = Array.from({ length: 1000 }, () => "Audit Logs"); // huge weight to push score over 100
    const result = calculateHeuristicScores({
      has_free_tier: true,
      spamProtection: "Advanced",
      coreFeatures: features,
    } as any);

    // Trust score should be 50 + 20 = 70
    expect(result.trustScore).toBe(70);

    // Competitor score should be clamped at 100
    expect(result.competitorScore).toBe(100);
  });
});
