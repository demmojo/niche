import { withModelFallback } from "./aiClient";

export interface TarpitAnalysisResult {
  isTarpit: boolean;
  score: number; // 0-100, 100 being extremely generic/tarpit
  reasoning: string;
  suggestedNiches: string[];
}

export async function analyzeProductForTarpit(
  productName: string,
  productDescription: string,
): Promise<TarpitAnalysisResult> {
  const prompt = `You are an expert product strategist. Analyze the following product idea to determine if it is a "Tarpit" (a highly horizontal, commoditized idea that is extremely difficult for a small team to distribute, e.g., "generic AI email client", "another basic CRM", "general purpose note-taking app").

Product Name: ${productName}
Description: ${productDescription}

Evaluate this product and respond with a JSON object strictly following this structure:
{
  "isTarpit": boolean (true if the idea is too generic/horizontal),
  "score": number (0-100, 100 being absolute generic tarpit, 0 being hyper-niche and defensible),
  "reasoning": string (Clear, impeccable reasoning explaining exactly WHY it is or isn't a tarpit. If it is a tarpit, cite real-world market saturation data or reasons why distribution will be a nightmare),
  "suggestedNiches": string[] (If it is a tarpit, provide 3 highly specific, underserved niches related to the original idea that would be much more viable for a small team. If not a tarpit, this can be empty)
}
`;

  try {
    const response = await withModelFallback(
      async (ai, model) => {
        return ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
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
