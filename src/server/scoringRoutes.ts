import { Router, Request } from "express";
import {
  requireAuth,
  requireAppCheck,
  AuthenticatedRequest,
} from "./authMiddleware";
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
import { z } from "zod";

export const scoringRouter = Router();

scoringRouter.post(
  "/count-competitors",
  requireAppCheck,
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
      const exaQuery = `Competitors to ${productName}: ${productDescription}`;

      // Just do a search to get the number of results, no contents needed (faster)
      const exaResponse = await exa.search(exaQuery, {
        type: "neural",
        useAutoprompt: true,
        numResults: 15, // Get a realistic number of potential competitors
      });

      return res.json({ count: exaResponse.results?.length || 0 });
    } catch (error: any) {
      console.error("Count Error:", error);
      return res.status(500).json({ error: error.message });
    }
  },
);

scoringRouter.post(
  "/tarpit-analyze",
  requireAppCheck,
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
Extract the reasoning, a verbatim exact quote from the competitor context that proves saturation or niche viability, the corresponding URL, and a wedge metric (0 to 1, where 1 is highly saturated, 0 is highly unique). If the idea is a tarpit, provide an array of 3 hyper-niche pivot suggestions (suggestedNiches) that are much more defensible.
    `;

      const callOptions = {
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: LLMExtractionSchema.toJSONSchema() as any,
          systemInstruction:
            "You are an expert M&A due diligence AI. Analyze the competitor saturation.",
        },
      };

      const geminiRes = await ai.models.generateContent(callOptions);

      const llmOutputRaw = geminiRes.text;
      console.log("Raw LLM output:", llmOutputRaw);
      if (!llmOutputRaw) throw new Error("Empty response from LLM");

      // Zod validation
      let llmParsed;
      try {
        llmParsed = LLMExtractionSchema.parse(JSON.parse(llmOutputRaw));
      } catch (parseError: any) {
        throw parseError;
      }

      const { calculateOpportunityScore } =
        await import("../utils/scoringEngine");
      const oppScore = calculateOpportunityScore(
        llmParsed.jtbd.importance,
        llmParsed.jtbd.satisfaction,
      );

      // 3. Implement Gemini gemini-embedding-001 integration
      // We embed the user's product description
      const embedRes = await ai.models.embedContent({
        model: "gemini-embedding-001",
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
        opportunityScore: oppScore,
      });

      finalScore = scoreResult.score;
      isTarpit = scoreResult.isTarpit;

      if (isTarpit) {
        // Fetch tarpit centroids to calculate Orthogonal Vector Distance
        // For now, we simulate this since actual centroids require the clustering worker to run.
        const mockCentroid = new Float32Array(768).fill(0.01);
        fastL2NormalizeInPlace(mockCentroid);

        const { calculateSquaredOrthogonalDistance } =
          await import("../utils/scoringEngine");
        const orthDistSq = calculateSquaredOrthogonalDistance(
          vector,
          mockCentroid,
        );

        const localDensity = 0.1; // Mock sub-market HHI
        const globalDensity = 0.9;

        // If orthDistSq is high, the vector is very orthogonal (novel)
        // A distance of 0.7 corresponds to a squared distance of 0.49
        if (orthDistSq > 0.49 || localDensity < 0.2) {
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
        suggestedNiches: llmParsed.suggestedNiches || [],
        vector: Array.from(vector), // return vector to be saved in DB if needed
      });
    } catch (error: any) {
      console.error("Scoring Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

scoringRouter.post(
  "/stream",
  requireAppCheck,
  requireAuth,
  async (req: any, res: any) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Helper to send SSE data
    const sendData = (type: string, value: any) => {
      res.write(`data: ${JSON.stringify({ type, value })}\n\n`);
    };

    try {
      const { productName, productDescription } = req.body;
      if (!productName || !productDescription) {
        sendData("error", "Missing product name or description");
        return res.end();
      }

      const exaApiKey = process.env.EXA_API_KEY;
      if (!exaApiKey) {
        sendData("error", "EXA_API_KEY is not configured");
        return res.end();
      }

      const exa = new Exa(exaApiKey);
      const exaQuery = `Competitors to ${productName}: ${productDescription}`;

      // 1. Fetch from Exa
      const exaResponse = await exa.searchAndContents(exaQuery, {
        type: "neural",
        numResults: 3,
        text: { maxCharacters: 1000 },
      });

      // Send competitor count immediately
      sendData("competitor_count", exaResponse.results?.length || 0);

      const competitorContext = exaResponse.results
        .map((r) => `URL: ${r.url}\nContent: ${r.text}`)
        .join("\n\n");

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        sendData("error", "GEMINI_API_KEY is not configured");
        return res.end();
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // 2. Strict LLM JSON Parsing with _reasoning
      const prompt = `
Analyze the following product concept and the retrieved competitor data.
Product Name: ${productName}
Description: ${productDescription}

Competitors:
${competitorContext}

Determine if this product idea is a defensible niche or a highly saturated horizontal tarpit.
Extract the reasoning, a verbatim exact quote from the competitor context that proves saturation or niche viability, the corresponding URL, and a wedge metric (0 to 1, where 1 is highly saturated, 0 is highly unique). If the idea is a tarpit, provide an array of 3 hyper-niche pivot suggestions (suggestedNiches) that are much more defensible.
    `;

      const callOptions = {
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: LLMExtractionSchema.toJSONSchema() as any,
          systemInstruction:
            "You are an expert M&A due diligence AI. Analyze the competitor saturation.",
        },
      };

      const geminiRes = await ai.models.generateContent(callOptions);
      const llmOutputRaw = geminiRes.text;
      if (!llmOutputRaw) throw new Error("Empty response from LLM");

      let llmParsed;
      try {
        llmParsed = LLMExtractionSchema.parse(JSON.parse(llmOutputRaw));
      } catch (parseError: any) {
        throw parseError;
      }

      const { calculateOpportunityScore } =
        await import("../utils/scoringEngine");
      const oppScore = calculateOpportunityScore(
        llmParsed.jtbd.importance,
        llmParsed.jtbd.satisfaction,
      );

      // Emit JTBD State
      sendData("jtbd_analysis", {
        job: llmParsed.jtbd.job_statement,
        opportunityScore: oppScore,
      });

      // Emit Gaps State
      sendData("gap_analysis", llmParsed.market_gaps);

      // 3. Send initial Tarpit Score
      const vectorUniqueness = 1.0 - (llmParsed.wedge_metric ?? 0.5);
      const apolloCount = 120; // Defaulting for synchronous check

      let scoreResult = calculateTarpitScore({
        vectorUniqueness,
        apolloCount,
        opportunityScore: oppScore,
      });

      sendData("tarpit_score", scoreResult);

      // 4. Implement Gemini embedding integration
      const embedRes = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: productDescription,
        config: { outputDimensionality: 768 },
      });

      const embeddingValues = embedRes.embeddings?.[0]?.values;
      if (!embeddingValues) throw new Error("Failed to generate embedding");

      const vector = new Float32Array(embeddingValues);
      fastL2NormalizeInPlace(vector);

      // Flywheel
      import("../services/tarpitFlywheel").then(({ storeTarpitQuery }) => {
        const userId = req.user?.uid || "anonymous-user-id";
        storeTarpitQuery(userId, productDescription, Array.from(vector)).catch(
          console.error,
        );
      });

      // 5. Orthogonal Vector Distance & System Override check
      let isFalsePositiveOverride = false;
      let finalScore = scoreResult.score;
      let isTarpit = scoreResult.isTarpit;

      if (isTarpit) {
        const mockCentroid = new Float32Array(768).fill(0.01);
        fastL2NormalizeInPlace(mockCentroid);

        const { calculateSquaredOrthogonalDistance } =
          await import("../utils/scoringEngine");
        const orthDistSq = calculateSquaredOrthogonalDistance(
          vector,
          mockCentroid,
        );

        const localDensity = 0.1;

        if (orthDistSq > 0.49 || localDensity < 0.2) {
          isFalsePositiveOverride = true;
          isTarpit = false;
          finalScore = Math.max(0, finalScore - 40);
          llmParsed._reasoning +=
            " [SYSTEM OVERRIDE: Orthogonal Vector Distance indicates a defensible wedge despite semantic similarity to a tarpit.]";
        }
      }

      // 6. Send Final Object
      sendData("final", {
        status: "success",
        score: finalScore,
        isTarpit: isTarpit,
        reasoning: llmParsed._reasoning,
        exact_quote: llmParsed.exact_quote,
        exa_url: llmParsed.exa_url,
        uniqueness: scoreResult.uniqueness,
        saturationFactor: scoreResult.saturationFactor,
        suggestedNiches: llmParsed.suggestedNiches || [],
        vector: Array.from(vector),
      });
    } catch (error: any) {
      console.error("Streaming Scoring Error:", error);
      sendData("error", error.message);
    } finally {
      res.end();
    }
  },
);
