import { test, expect } from "vitest";
import fc from "fast-check";
import { SafeJsonStreamParser } from "../../utils/SafeJsonStream";
import { z } from "zod";

// 1. Define NicheAI domain schemas
const CompetitorDiscoveryEvent = z.object({
  type: z.literal("competitor_discovery"),
  data: z.object({
    niche: z.string(),
    tarpitRisk: z.number().min(0).max(1),
    competitors: z.array(z.string()),
  }),
});

const MarketValidationEvent = z.object({
  type: z.literal("market_validation"),
  data: z.object({
    isBlueOcean: z.boolean(),
    g2NegativeReviewThemes: z.array(z.string()),
  }),
});

// 2. The Discriminated Union representing the LLM output stream
export const LlmStreamEventSchema = z.discriminatedUnion("type", [
  CompetitorDiscoveryEvent,
  MarketValidationEvent,
]);

// 3. Generate the fast-check Arbitrary natively
export const llmEventArbitrary = fc.oneof(
  fc.record({
    type: fc.constant("competitor_discovery"),
    data: fc.record({
      niche: fc.string(),
      tarpitRisk: fc.double({
        min: 0,
        max: 1,
        noNaN: true,
        noDefaultInfinity: true,
      }),
      competitors: fc.array(fc.string()),
    }),
  }),
  fc.record({
    type: fc.constant("market_validation"),
    data: fc.record({
      isBlueOcean: fc.boolean(),
      g2NegativeReviewThemes: fc.array(fc.string()),
    }),
  }),
);

test("SafeJsonStreamParser never throws SyntaxError on partial valid JSON chunks", () => {
  fc.assert(
    fc.property(
      // 1. Generate a valid LLM event based on our Zod discriminated union
      llmEventArbitrary,
      // 2. Generate an array of random split percentages (0.01 to 0.99)
      fc.array(fc.double({ min: 0.01, max: 0.99 }), {
        minLength: 1,
        maxLength: 50,
      }),

      (validEvent, splitRatios) => {
        const fullJson = JSON.stringify(validEvent);

        // Convert ratios to exact string indices and sort them sequentially
        const splitIndices = [
          ...new Set(splitRatios.map((r) => Math.floor(r * fullJson.length))),
        ].sort((a, b) => a - b);

        // Chop the JSON string into unpredictable chunks
        const chunks: string[] = [];
        let lastIdx = 0;
        for (const idx of splitIndices) {
          if (idx > lastIdx) {
            chunks.push(fullJson.slice(lastIdx, idx));
            lastIdx = idx;
          }
        }
        chunks.push(fullJson.slice(lastIdx)); // Push the final remaining chunk

        const parser = new SafeJsonStreamParser();
        let lastParsed: unknown = null;

        // --- THE INGESTION FUZZER ---
        for (const chunk of chunks) {
          // Property 1: Ingestion of valid partial chunks MUST NEVER throw a SyntaxError
          expect(() => {
            const result = parser.ingest(chunk);
            if (result !== null) {
              lastParsed = result;
            }
          }).not.toThrow(SyntaxError);
        }

        // Property 2: Once the stream completes, the deeply parsed object must match the original AST
        expect(lastParsed).toEqual(validEvent);

        // Property 3: Ensure Zod strictly validates the final assembled result
        expect(() => LlmStreamEventSchema.parse(lastParsed)).not.toThrow();
      },
    ),
    {
      numRuns: 1000, // Run 1000 different fuzzy scenarios
      verbose: true,
    },
  );
});
