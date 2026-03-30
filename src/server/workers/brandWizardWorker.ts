import * as admin from "firebase-admin";
import pLimit from "p-limit";

import { z } from "zod";
import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize external APIs
const getAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const getFirecrawl = () =>
  new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || "mock-key" });

// Strict Zod schema enforcing Chain of Thought and bounds
const CompetitorBrandSchema = z.object({
  positioning: z.object({
    _reasoning: z
      .string()
      .describe(
        "Step-by-step reasoning for brand positioning based on the markdown data.",
      ),
    personality: z.string(),
    tone: z.array(
      z.enum([
        "Professional",
        "Playful",
        "Aggressive",
        "Authoritative",
        "Conversational",
      ]),
    ),
    target_audience: z.string(),
  }),
  visual_identity: z.object({
    logo_url: z.string().url().nullable().optional(),
    colors: z.object({
      primary: z.array(
        z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
      ),
      background: z.array(
        z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
      ),
    }),
    typography: z.object({
      headings: z.array(z.string()),
      body: z.array(z.string()),
    }),
  }),
});

// Gemini Schema Equivalent
const GeminiCompetitorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    positioning: {
      type: Type.OBJECT,
      properties: {
        _reasoning: {
          type: Type.STRING,
          description:
            "Step-by-step reasoning for brand positioning based on the markdown data.",
        },
        personality: { type: Type.STRING },
        tone: { type: Type.ARRAY, items: { type: Type.STRING } },
        target_audience: { type: Type.STRING },
      },
      required: ["_reasoning", "personality", "tone", "target_audience"],
    },
    visual_identity: {
      type: Type.OBJECT,
      properties: {
        logo_url: { type: Type.STRING },
        colors: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.ARRAY, items: { type: Type.STRING } },
            background: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["primary", "background"],
        },
        typography: {
          type: Type.OBJECT,
          properties: {
            headings: { type: Type.ARRAY, items: { type: Type.STRING } },
            body: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["headings", "body"],
        },
      },
      required: ["colors", "typography"],
    },
  },
  required: ["positioning", "visual_identity"],
};

/**
 *
 */
export const processBrandWizardJob = async (jobData: any) => {
  const limit = pLimit(3); // Protect memory, limit concurrency for scrapes

  const { jobId, urls } = jobData;
  const db = admin.firestore();
  const jobRef = db.collection("brand_wizard_jobs").doc(jobId);

  await jobRef.update({ status: "processing" });

  const results: any[] = [];

  await Promise.all(
    urls.map((url: string) =>
      limit(async () => {
        let markdown = "";
        let firecrawlResult: any = null;

        try {
          // 1. Scrape with Firecrawl
          firecrawlResult = await getFirecrawl().scrape(url, {
            formats: ["markdown", "branding"], // Fallback if supported
          });

          if (!firecrawlResult.success) {
            throw new Error(`Firecrawl failed for ${url}`);
          }

          markdown = firecrawlResult.markdown || "";
        } catch (err: any) {
          console.warn(
            `Scraping failed for ${url}, fallback to Exa API needed:`,
            err,
          );
          // Graceful degradation (Skipping Exa Fallback logic for simplicity/YAGNI, per plan)
          await jobRef.update({
            "progress.failed": admin.firestore.FieldValue.increment(1),
          });
          return; // Skip this competitor
        }

        // Payload bloat mitigation
        if (markdown.length > 50000) {
          markdown = markdown.substring(0, 50000);
        }

        // 2. Gemini Extraction with Retry Loop
        let parsedData = null;
        let attempts = 0;
        const maxAttempts = 3;
        let errorFeedback = "";

        while (attempts < maxAttempts && !parsedData) {
          attempts++;
          try {
            const response = await getAi().models.generateContent({
              model: "gemini-3.1-flash",
              contents: `Extract the brand identity and positioning from the following competitor markdown data. 
                  ${errorFeedback ? `\nPREVIOUS ERROR: ${errorFeedback}\nFix the JSON format to match constraints.` : ""}
                  
                  URL: ${url}
                  
                  Markdown:
                  ${markdown}
                  
                  ${firecrawlResult?.branding ? `Branding JSON: ${JSON.stringify(firecrawlResult.branding)}` : ""}`,
              config: {
                responseMimeType: "application/json",
                responseSchema: GeminiCompetitorSchema,
                temperature: 0.1,
              },
            });

            const rawJson = JSON.parse(response.text || "{}");

            // Zod Validation enforcement
            const validation = CompetitorBrandSchema.safeParse(rawJson);
            if (!validation.success) {
              errorFeedback = JSON.stringify(validation.error.issues);
              continue; // Try again
            }

            parsedData = validation.data;
          } catch (llmError: any) {
            console.error(
              `Gemini extraction failed for ${url} (Attempt ${attempts}):`,
              llmError,
            );
            errorFeedback = llmError.message;
          }
        }

        // Explicitly discard raw markdown to prevent memory exhaustion
        markdown = "";

        if (parsedData) {
          results.push({
            id: Math.random().toString(36).substring(7),
            url,
            ...parsedData,
          });

          await jobRef.update({
            "progress.completed": admin.firestore.FieldValue.increment(1),
          });
        } else {
          await jobRef.update({
            "progress.failed": admin.firestore.FieldValue.increment(1),
          });
        }
      }),
    ),
  );

  // Save final results
  await jobRef.update({
    status: "completed",
    results,
  });

  return { success: true, resultsCount: results.length };
};
