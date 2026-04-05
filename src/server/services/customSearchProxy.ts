import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface SearchMetrics {
  indexation_size: number;
  sponsored_presence: boolean;
}

const MetricsSchema = z.object({
  indexationSize: z
    .string()
    .describe("Estimated number of indexed pages as a string, e.g., '1500'"),
  sponsoredAdPresence: z
    .boolean()
    .describe(
      "Whether sponsored ads are present for this domain's core keywords",
    ),
});

export async function fetchCustomSearchMetrics(
  domain: string,
): Promise<SearchMetrics> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.warn(
      "Missing GEMINI_API_KEY. Skipping organic metrics via Gemini Search Grounding.",
    );
    return {
      indexation_size: 0,
      sponsored_presence: false,
    };
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash",
      contents: `Search Google for "site:${domain}" and estimate the total number of indexed pages. Also check if there are sponsored ads for this domain's core keywords. Return the metrics.`,
      config: {
        tools: [{ googleSearch: {} }], // Enable native Google Search Grounding
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(MetricsSchema as any) as any, // Enforce shape per ml-engineering-standards
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        indexation_size: parseInt(parsed.indexationSize || "0", 10),
        sponsored_presence: !!parsed.sponsoredAdPresence,
      };
    }
  } catch (error) {
    console.error(
      `Gemini Search Grounding execution failed for domain ${domain}:`,
      error,
    );
  }

  return {
    indexation_size: 0,
    sponsored_presence: false,
  };
}
