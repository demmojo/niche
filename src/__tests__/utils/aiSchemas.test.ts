import { describe, it, expect } from "vitest";
import {
  BaseMLInsightSchema,
  CompetitorExtractionSchema,
  DerivedInsightExtractionSchema,
  JobToBeDoneExtractionSchema,
  sanitizeForXml,
} from "../../utils/aiSchemas";

describe("aiSchemas", () => {
  describe("sanitizeForXml", () => {
    it("should remove < and > characters", () => {
      expect(sanitizeForXml("<tag>Hello</tag>")).toBe("tagHello/tag");
    });
    it("should return empty string if falsy", () => {
      expect(sanitizeForXml("")).toBe("");
      expect(sanitizeForXml(null as any)).toBe("");
    });
  });

  describe("BaseMLInsightSchema", () => {
    it("should validate base ML insight", () => {
      const data = {
        confidenceScore: 0.9,
        verbatimQuotes: ["Quote 1", "Quote 2"],
        isHumanVerified: true,
      };
      expect(BaseMLInsightSchema.safeParse(data).success).toBe(true);
    });

    it("should fail if confidenceScore is out of bounds", () => {
      const data = {
        confidenceScore: 1.5,
        verbatimQuotes: [],
      };
      expect(BaseMLInsightSchema.safeParse(data).success).toBe(false);
    });
  });

  describe("CompetitorExtractionSchema", () => {
    it("should validate valid competitor data", () => {
      const data = {
        schemaVersion: "1.0.0",
        chain_of_thought_rationale: "Rationale",
        name: "Comp 1",
        website: "https://example.com",
        has_free_tier: true,
        freeTier: "Basic plan",
        spamProtection: "Captcha",
        integrations: ["Slack"],
        integration_footprint_score: 8,
        targetAudience: "Startups",
        icp_shifts: ["Shift 1"],
        gtm_motions: ["PLG"],
        firmographic_hiring_ratio: "2:1",
        marketSegments: ["Tech"],
        dataSovereignty: "US",
        sovereigntyScore: "low",
        financialSnapshot: "Bootstrapped",
        coreFeatures: ["Feat 1"],
        howWeCompare: "Better",
      };
      expect(CompetitorExtractionSchema.safeParse(data).success).toBe(true);
    });
  });

  describe("DerivedInsightExtractionSchema", () => {
    it("should validate valid insight data", () => {
      const data = {
        schemaVersion: "1.0.0",
        chain_of_thought_rationale: "Reason",
        title: "Insight Title",
        description: "Insight description goes here",
        category: "opportunity",
        impact: "high",
        source: "AI",
        tags: ["tag1"],
      };
      expect(DerivedInsightExtractionSchema.safeParse(data).success).toBe(true);
    });
  });

  describe("JobToBeDoneExtractionSchema", () => {
    it("should validate valid JTBD data", () => {
      const data = {
        schemaVersion: "1.0.0",
        confidenceScore: 0.8,
        verbatimQuotes: [],
        isHumanVerified: false,
        chain_of_thought_rationale: "Logic",
        jobStatement: "Help me test code so I can deploy.",
        importanceScore: 8,
        currentSatisfactionScore: 5,
      };
      expect(JobToBeDoneExtractionSchema.safeParse(data).success).toBe(true);
    });
  });
});
