import { z } from "zod";

// Zod v4 explicitly allows top-level schema validation features, though v3 is what's typically installed.
// We'll follow standard zod structure with explicit max and min bounds.

// ----------------------------------------------------------------------
// Base Schemas for Mock Data Replacement
// ----------------------------------------------------------------------

export const BaseMLInsightSchema = z.object({
  confidenceScore: z.number().min(0).max(1),
  verbatimQuotes: z.array(z.string().min(5).max(1000)).min(0).max(10),
  isHumanVerified: z.boolean().default(false),
});

export const CompetitorExtractionSchema = z.discriminatedUnion(
  "schemaVersion",
  [
    z.object({
      schemaVersion: z.literal("1.0.0"),
      name: z.string().min(1).max(200),
      website: z.string().url().max(500),
      has_free_tier: z.boolean(),
      freeTier: z.string().min(1).max(200),
      spamProtection: z.string().min(1).max(200),
      integrations: z.array(z.string().min(1).max(100)).max(50),
      targetAudience: z.string().min(1).max(200),
      marketSegments: z.array(z.string().min(1).max(100)).max(10),
      dataSovereignty: z.string().min(1).max(200),
      sovereigntyScore: z.enum(["low", "medium", "high"]),
      financialSnapshot: z.string().min(1).max(200),
      coreFeatures: z.array(z.string().min(1).max(200)).max(20),
      howWeCompare: z.string().min(1).max(1000),
    }),
  ],
);

export const DerivedInsightExtractionSchema = z.discriminatedUnion(
  "schemaVersion",
  [
    z.object({
      schemaVersion: z.literal("1.0.0"),
      title: z.string().min(5).max(200),
      description: z.string().min(10).max(2000),
      category: z.enum(["opportunity", "threat", "trend"]),
      impact: z.enum(["high", "medium", "low", "critical"]),
      source: z.enum(["AI", "Human", "Brainstorm", "Exa.ai", "Crunchbase"]),
      tags: z.array(z.string().min(1).max(50)).max(10).optional(),
    }),
  ],
);

export const JobToBeDoneExtractionSchema = z.discriminatedUnion(
  "schemaVersion",
  [
    BaseMLInsightSchema.extend({
      schemaVersion: z.literal("1.0.0"),
      jobStatement: z.string().min(10).max(500),
      importanceScore: z.number().min(1).max(10),
      currentSatisfactionScore: z.number().min(1).max(10),
    }),
  ],
);

// ----------------------------------------------------------------------
// Prompts (incorporating Leeroopedia best practices)
// ----------------------------------------------------------------------

export const PROMPTS = {
  // Uses gemini-3.1-flash for metadata
  EXTRACT_COMPETITOR_METADATA: `
You are an expert market analyst.
Extract competitor metadata from the provided context.

Hypothesis Templates to follow:
- "This competitor's name is {name}"
- "The primary target audience is {targetAudience}"
- "This text is about integrations with {integrations}"

Return a valid JSON object matching the requested schema.
`,

  // Uses gemini-3.1-pro for complex unstructured reasoning
  EXTRACT_JTBD: `
You are an expert product strategist.
Analyze the following context (customer reviews, feature descriptions, etc.) and extract the core Jobs-To-Be-Done (JTBD).

A Job-To-Be-Done is defined as: "Help me [action] so I can [expected outcome]".
Focus on uncovering underlying customer needs rather than feature requests.

Ensemble considerations to improve accuracy:
- Think about what the user is trying to avoid.
- Think about what the user is trying to achieve.
- Think about what work is taking too long.

Extract up to 5 core JTBDs. Return a JSON array of objects matching the schema.
`,

  EXTRACT_DERIVED_INSIGHTS: `
You are an expert competitive intelligence analyst.
Analyze the provided context and identify key derived insights. Classify them into "opportunity", "threat", or "trend".
Focus heavily on precision. Do not hallucinate. If an insight lacks evidence, do not extract it.
`,
};

export const sanitizeForXml = (text: string) => {
  if (!text) return "";
  return text.replace(/[<>]/g, "");
};
