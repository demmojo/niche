import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const ArtifactSemanticSchema = z.object({
  isToneCompliant: z
    .boolean()
    .describe("True if the microcopy aligns with the target tone."),
  feedback: z
    .string()
    .describe("Specific feedback on microcopy and tone violations."),
});

/**
 *
 */
export const validateArtifactTone = async (
  code: string,
  brandIdentity: any,
  geminiApiKey: string,
) => {
  const positioning = brandIdentity?.selected_identity?.positioning;
  if (!positioning) throw new Error("Incomplete brand identity.");

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const prompt = `Evaluate if the microcopy matches the tone: ${positioning.tone.join(", ")}.
<code_to_review>
${code}
</code_to_review>`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT" as any,
        properties: {
          isToneCompliant: { type: "BOOLEAN" as any },
          feedback: { type: "STRING" as any },
        },
        required: ["isToneCompliant", "feedback"],
      },
    },
  });

  const parsedJson = JSON.parse(response.text || "{}");
  return ArtifactSemanticSchema.parse(parsedJson);
};
