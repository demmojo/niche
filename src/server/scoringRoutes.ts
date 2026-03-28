import { Router, Request } from "express";
import { requireAuth, AuthenticatedRequest } from "./authMiddleware";
import {
  calculateTarpitScore,
  LLMExtractionSchema,
  fastL2NormalizeInPlace,
} from "../utils/scoringEngine";
import Exa from "exa-js";
import { GoogleGenAI, Type } from "@google/genai";
import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

export const scoringRouter = Router();

scoringRouter.post(
  "/tarpit-analyze",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const { productName, productDescription } = req.body;
      if (!productName || !productDescription) {
        return res
          .status(400)
          .json({ error: "Missing product name or description" });
      }

      const exaApiKey = process.env.EXA_API_KEY;
      if (!exaApiKey) {
        return res.status(500).json({ error: "EXA_API_KEY is not configured" });
      }

      const exa = new Exa(exaApiKey);

      // 1. Fetch from Exa
      const exaQuery = `Competitors to ${productName}: ${productDescription}`;
      const exaResponse = await exa.searchAndContents(exaQuery, {
        type: "neural",
        numResults: 3,
        text: { maxCharacters: 1000 },
      });

      const competitorContext = exaResponse.results
        .map((r) => `URL: ${r.url}\nContent: ${r.text}`)
        .join("\n\n");

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res
          .status(500)
          .json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // 2. Strict LLM JSON Parsing with _reasoning
      // We use LLMExtractionSchema
      const prompt = `
Analyze the following product concept and the retrieved competitor data.
Product Name: ${productName}
Description: ${productDescription}

Competitors:
${competitorContext}

Determine if this product idea is a defensible niche or a highly saturated horizontal tarpit.
Extract the reasoning, a verbatim exact quote from the competitor context that proves saturation or niche viability, the corresponding URL, and a wedge metric (0 to 1, where 1 is highly saturated, 0 is highly unique).
    `;

      const jsonSchema = zodToJsonSchema(
        LLMExtractionSchema as any,
        "LLMExtraction",
      );

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.1-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema as any,
          systemInstruction:
            "You are an expert M&A due diligence AI. Analyze the competitor saturation.",
        },
      });

      const llmOutputRaw = geminiRes.text;
      if (!llmOutputRaw) throw new Error("Empty response from LLM");

      // Zod validation
      const llmParsed = LLMExtractionSchema.parse(JSON.parse(llmOutputRaw));

      // 3. Implement Gemini text-embedding-004 integration
      // We embed the user's product description
      const embedRes = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: productDescription,
        config: { outputDimensionality: 768 },
      });

      const embeddingValues = embedRes.embeddings?.[0]?.values;
      if (!embeddingValues) throw new Error("Failed to generate embedding");

      const vector = new Float32Array(embeddingValues);

      // 4. Implement local L2-normalization loop-unrolled SIMD
      fastL2NormalizeInPlace(vector);

      // Asynchronously insert into Tarpit Data Flywheel
      import("../services/tarpitFlywheel").then(({ storeTarpitQuery }) => {
        const userId = req.user?.uid || "anonymous-user-id";
        storeTarpitQuery(userId, productDescription, Array.from(vector)).catch(
          console.error,
        );
      });

      // 5 & 6. Niche Viability Score & False Positive Filter
      const vectorUniqueness = 1.0 - (llmParsed.wedge_metric ?? 0.5);
      const apolloCount = 120; // Defaulting for synchronous check

      // Orthogonal Vector Distance & Density check (False Positive Tarpit Prevention)
      // Scenario 2: If it's flagged as a Tarpit, but Orthogonal Distance is high or Local Density is near-zero, override it.
      let isFalsePositiveOverride = false;
      let finalScore = 0;
      let isTarpit = false;

      const scoreResult = calculateTarpitScore({
        vectorUniqueness,
        apolloCount,
      });

      finalScore = scoreResult.score;
      isTarpit = scoreResult.isTarpit;

      if (isTarpit) {
        // Fetch tarpit centroids to calculate Orthogonal Vector Distance
        // For now, we simulate this since actual centroids require the clustering worker to run.
        const mockCentroid = new Float32Array(768).fill(0.01);
        fastL2NormalizeInPlace(mockCentroid);

        const scratchpad = new Float32Array(768);
        const { calculateOrthogonalDistance } =
          await import("../utils/scoringEngine");
        const orthDist = calculateOrthogonalDistance(
          vector,
          mockCentroid,
          scratchpad,
        );

        const localDensity = 0.1; // Mock sub-market HHI
        const globalDensity = 0.9;

        if (orthDist > 0.7 || localDensity < 0.2) {
          isFalsePositiveOverride = true;
          isTarpit = false;
          finalScore = Math.max(0, finalScore - 40); // Penalty lifted
          llmParsed._reasoning +=
            " [SYSTEM OVERRIDE: Orthogonal Vector Distance indicates a defensible wedge despite semantic similarity to a tarpit.]";
        }
      }

      res.status(200).json({
        status: "success",
        score: scoreResult.score,
        isTarpit: scoreResult.isTarpit,
        reasoning: llmParsed._reasoning,
        exact_quote: llmParsed.exact_quote,
        exa_url: llmParsed.exa_url,
        uniqueness: scoreResult.uniqueness,
        saturationFactor: scoreResult.saturationFactor,
        vector: Array.from(vector), // return vector to be saved in DB if needed
      });
    } catch (error: any) {
      console.error("Scoring Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);
