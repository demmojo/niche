import { withModelFallback } from "./aiClient";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface TarpitAnalysisResult {
  isTarpit: boolean;
  score: number; // 0-100, 100 being extremely generic/tarpit
  reasoning: string;
  suggestedNiches: string[];
}

const tarpitSchema = z.object({
  isTarpit: z
    .boolean()
    .describe("true if the idea is too generic/horizontal/commoditized"),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "0-100, 100 being absolute generic tarpit, 0 being hyper-niche and defensible",
    ),
  reasoning: z
    .string()
    .describe(
      "Clear reasoning explaining exactly WHY it is or isn't a tarpit. Cite market saturation if applicable.",
    ),
  suggestedNiches: z
    .array(z.string())
    .describe(
      "If it is a tarpit, provide 3 highly specific, underserved niches. If not, this can be empty.",
    ),
});

export async function analyzeProductForTarpit(
  productName: string,
  productDescription: string,
): Promise<TarpitAnalysisResult> {
  const prompt = `
You are an expert product strategist. (Context)
Your goal is to determine if a product idea is a "Tarpit" (a highly horizontal, commoditized idea that is extremely difficult for a small team to distribute). (Objective)
Be highly critical, realistic, and objective. (Style & Tone)
Your audience is a solo founder or small startup team looking to avoid building something no one wants or can't be marketed. (Audience)
Return a strictly formatted JSON object analyzing the idea. (Response)

<processing_rules>
1. Examples of Tarpits: "generic AI email client", "another basic CRM", "general purpose note-taking app".
2. Assess distribution difficulty.
3. If it is a Tarpit, suggest 3 highly specific, underserved niches related to the original idea.
</processing_rules>

<product>
  <name>${productName}</name>
  <description>${productDescription}</description>
</product>
`;

  try {
    const response = await withModelFallback(
      async (ai, model) => {
        return ai.generateContent(model, {
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(tarpitSchema) as any,
          },
        });
      },
      { tier: "fast" },
    );

    const text = response.text || "{}";
    const result = JSON.parse(text) as TarpitAnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing tarpit:", error);
    // Fallback to safe
    return {
      isTarpit: false,
      score: 0,
      reasoning: "Failed to analyze.",
      suggestedNiches: [],
    };
  }
}
