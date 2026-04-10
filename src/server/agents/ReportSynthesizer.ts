import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

const ReportSchema = z.object({
  tarpitScore: z.number().min(0).max(100),
  draftMarkdown: z.string(),
  moatIdentified: z.string(),
});

export class ReportSynthesizer {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock" });
  }

  // A mocked mathematical deterministic override for the LLM
  private calculateMathematicalTarpitDistance(exaResults: any[]): number {
    // In a real system, this would use SharedArrayBuffer + Float32Array to calculate K-Means orthogonal distance
    // We mock a deterministic score based on the length of results
    if (exaResults.length === 0) return 0;
    return Math.min(100, exaResults.length * 20); // e.g. 3 results = 60
  }

  async synthesize(idea: string, context: any) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro",
      contents: `Synthesize a report for: ${idea.replace(/[<>]/g, "")}\n\nContext: ${JSON.stringify(context)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(ReportSchema) as any,
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    // SYSTEM OVERRIDE PATTERN
    // Mathematically validate the LLM's classification
    const mathematicalScore = this.calculateMathematicalTarpitDistance(
      context.exaResults,
    );

    // If the LLM says it's an 85 (high saturation) but math says it's only 60, we override the LLM.
    const finalScore =
      Math.abs(parsed.tarpitScore - mathematicalScore) > 15
        ? mathematicalScore
        : parsed.tarpitScore;

    return {
      tarpitScore: finalScore,
      draftMarkdown: parsed.draftMarkdown,
      moatIdentified: parsed.moatIdentified,
      wasOverridden: finalScore !== parsed.tarpitScore,
    };
  }
}
