import { GoogleGenAI } from "@google/genai";

export type Preference = "BASELINE_WINS" | "CANDIDATE_WINS" | "TIE";

interface JudgeResult {
  preference: Preference;
  rationale: string;
}

export async function evaluatePairwise(
  prompt: string,
  baselineOutput: string,
  candidateOutput: string,
): Promise<JudgeResult> {
  // To prevent position bias, we randomize A and B, then map back to Baseline/Candidate
  const isBaselineA = Math.random() > 0.5;
  const outputA = isBaselineA ? baselineOutput : candidateOutput;
  const outputB = isBaselineA ? candidateOutput : baselineOutput;

  const systemPrompt = `
    You are an expert Pairwise Preference Judge for NicheAI. 
    Your goal is to evaluate two AI-generated responses to a specific prompt.
    
    Evaluation Criteria:
    1. Factual accuracy and absence of hallucinations.
    2. Alignment with NicheAI principles: hyper-specific, actionable, and avoiding horizontal "tarpit" ideas.
    3. Formatting and structural adherence.

    Respond STRICTLY in JSON format:
    {
      "preference": "A" | "B" | "TIE",
      "rationale": "<step-by-step justification>"
    }
  `;

  const userPrompt = `
    PROMPT: ${prompt}
    
    OUTPUT A:
    ${outputA}
    
    OUTPUT B:
    ${outputB}
  `;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");
  const ai = new GoogleGenAI({ apiKey: geminiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  let preference: Preference = "TIE";

  if (parsed.preference === "A")
    preference = isBaselineA ? "BASELINE_WINS" : "CANDIDATE_WINS";
  if (parsed.preference === "B")
    preference = isBaselineA ? "CANDIDATE_WINS" : "BASELINE_WINS";

  return { preference, rationale: parsed.rationale };
}
