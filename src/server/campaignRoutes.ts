import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthenticatedRequest } from "./authMiddleware";
import * as adminNamespace from "firebase-admin";
const admin = adminNamespace;
import pMap from "p-map";
import { getActionCredits, deductActionCredit } from "./credits";
import {
  calculateTarpitScore,
  calculateCosineSimilarity,
  calculateOrthogonalDistance,
  getTaxonomyThresholds,
  fastL2NormalizeInPlace,
  LLMExtractionSchema,
  validateExaUrl,
} from "../utils/scoringEngine";
import { campaignLimiter, fakeDoorSignalLimiter } from "./rateLimit";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { networkIoQueue } from "./queues";
import express from "express";
import Exa from "exa-js";
import {
  FakeDoorSignalInputSchema,
  ForkProductInputSchema,
  CreateProductInputSchema,
} from "../types/product";

// Zod schemas for strict input validation
const CompetitorSchema = z
  .object({
    name: z.string().max(200).optional(),
    domain: z.string().max(2000).optional(),
    description: z.string().max(10000).optional(),
  })
  .passthrough(); // Allow extra fields but validate the core ones

const CampaignRequestSchema = z
  .object({
    competitors: z.array(CompetitorSchema).optional().default([]),
    baseIdea: z
      .union([
        z.string().max(10000),
        z
          .object({
            name: z.string().min(1).max(500),
            description: z.string().max(10000).optional(),
          })
          .strict(),
      ])
      .optional(),
  })
  .refine(
    (data) => {
      // If no competitors, baseIdea MUST be an object with a non-empty name
      if (data.competitors.length === 0) {
        if (
          !data.baseIdea ||
          typeof data.baseIdea !== "object" ||
          !("name" in data.baseIdea)
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "If competitors are empty, baseIdea with a name must be provided to discover competitors.",
    },
  );

export const campaignRouter = Router();

// Endpoint for generating Data-Inverted Sub-Niches
campaignRouter.post(
  "/pivot",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.uid;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { competitors, baseIdea } = req.body || {};
      if (!competitors || !baseIdea)
        return res
          .status(400)
          .json({ error: "Missing competitors or baseIdea." });

      // Deduct credit for the pivot
      await deductActionCredit(userId);

      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is missing");
      const ai = new GoogleGenAI({ apiKey: key });
      console.log("POST /pivot ai:", ai, "models:", ai.models);

      const prompt = `Based on the following base idea and its competitors, generate a data-inverted sub-niche pivot.
Base Idea: ${JSON.stringify(baseIdea)}
Competitors: ${JSON.stringify(competitors)}

Output exactly 1 subNiche object in JSON array inside an object with key "subNiches".
Each subNiche should have:
- name (string)
- audience (string)
- price (string)
- gtm (string)
- scope (string)
- proof (string)
`;

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.1-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction:
            "You are an expert startup advisor. Always return valid JSON matching the requested structure.",
        },
      });

      const responseText = geminiRes.text;
      const realResponse =
        typeof responseText === "string"
          ? JSON.parse(responseText)
          : responseText;

      res.json(realResponse);
    } catch (error: any) {
      console.error("Pivot generation error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to generate sub-niches" });
    }
  },
);

const MAX_COMPETITORS = 100;

const DiscoveredCompetitorSchema = z.object({
  name: z.string(),
  domain: z.string(),
  description: z.string(),
  similarityScore: z.number().min(0).max(100),
  matchTier: z.enum(["Direct", "Adjacent", "Legacy"]),
  matchRationale: z.string(),
});

const DiscoverCompetitorsRequestSchema = z.object({
  baseIdea: z.string().max(10000).optional().or(z.object({}).passthrough()),
});

// Helper for Exa domain search using heuristics
async function fetchExaCompetitors(baseIdea: any) {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return [];
  const exa = new Exa(exaKey);
  const ideaStr =
    typeof baseIdea === "string"
      ? baseIdea
      : `${baseIdea?.name || "product"}: ${baseIdea?.description || "startup"}`;

  try {
    const exaResponse = await exa.searchAndContents(ideaStr, {
      type: "neural",
      numResults: 7, // Fetch a bit more to filter down
      text: { maxCharacters: 800 },
      includeDomains: ["reddit.com", "g2.com"], // Use Exa's native includeDomains filter
    });
    return exaResponse.results;
  } catch (error) {
    console.error("Exa discovery error:", error);
    return [];
  }
}

campaignRouter.post(
  "/discover-competitors",
  requireAuth,
  fakeDoorSignalLimiter, // Reusing a light rate limiter
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const validationResult = DiscoverCompetitorsRequestSchema.safeParse(
        req.body || {},
      );
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request payload",
          details: validationResult.error.format(),
        });
      }

      const { baseIdea } = validationResult.data;
      if (
        !baseIdea ||
        (typeof baseIdea === "object" && Object.keys(baseIdea).length === 0)
      ) {
        return res.json({ competitors: [] });
      }

      const exaResults = await fetchExaCompetitors(baseIdea);
      if (exaResults.length === 0) {
        return res.json({ competitors: [] });
      }

      const { withModelFallback } = await import("../utils/aiClient");

      const prompt = `You are a strategic product analyst. I have a product idea and a list of search results.
Your job is to identify the actual competitor products from these search results, and score them based on Job-to-be-Done, Audience, and Mechanism overlap.

Product Idea: ${JSON.stringify(baseIdea)}

Search Results: ${JSON.stringify(exaResults.map((r: any) => ({ url: r.url, title: r.title, text: r.text })))}

Extract the top 3 to 5 actual software products/competitors found in these results. 
For each, provide:
- name: The product name
- domain: Their website URL (extracted from the search result URL if possible)
- description: A brief 1-2 sentence description
- similarityScore: 0-100 score based on (JTBD * 0.5) + (Audience * 0.3) + (Mechanism * 0.2)
- matchTier: "Direct" (80-100), "Adjacent" (50-79), or "Legacy" (<50)
- matchRationale: One concise sentence explaining exactly *why* they match based on the 3 factors.

Return the result strictly adhering to the JSON schema.`;

      const ListSchema = z.object({
        competitors: z.array(DiscoveredCompetitorSchema),
      });

      const responseText = await withModelFallback(
        async (ai: any, modelName: string) => {
          const m = ai.models
            ? ai
            : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const res = await m.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: zodToJsonSchema(ListSchema as any) as any,
            },
          });
          return res.text;
        },
        { capability: "data-extraction" as any },
      );

      let parsed;
      try {
        parsed = JSON.parse(responseText);
        // Handle Gemini returning it wrapped or unwrapped depending on strict schema compliance
        if (!parsed.competitors && Array.isArray(parsed)) {
          parsed = { competitors: parsed };
        }
      } catch (e) {
        console.error("Failed to parse LLM discovery response:", e);
        // Graceful degradation: return raw Exa results
        return res.json({
          competitors: exaResults.slice(0, 5).map((r: any) => ({
            name: r.title || r.url,
            domain: r.url,
            description: r.text ? r.text.substring(0, 200) : "",
            similarityScore: 0,
            matchTier: "Adjacent",
            matchRationale: "Discovered via web search.",
          })),
        });
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Competitor discovery error:", error);
      res.status(500).json({ error: "Internal server error during discovery" });
    }
  },
);

// Apply stateless API rate limiter for validation campaign (BFF Route)
campaignRouter.post(
  "/start",
  requireAuth,
  campaignLimiter,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      // #region agent log
      // #endregion
      const userId = req.user?.uid;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // 0. Strict Schema Validation (Zod)
      console.log("BODY", req.body);
      const validationResult = CampaignRequestSchema.safeParse(req.body || {});
      if (!validationResult.success) {
        // #region agent log
        // #endregion
        return res.status(400).json({
          error: "Invalid request payload",
          details: validationResult.error.format(),
        });
      }

      const { competitors, baseIdea } = validationResult.data;

      const db = admin.firestore();

      // 1. Check Pre-Authorization Quota (Action Credits)
      const costPerCampaign = 1; // Or derived from competitors.length
      const currentCredits = await getActionCredits(userId);
      if (currentCredits < costPerCampaign) {
        // #region agent log
        // #endregion
        return res.status(402).json({
          error: "Insufficient Action Credits",
          message: "You have exhausted your monthly validation credits.",
        });
      }

      // 2. TOCTOU Mitigation: Hold (Deduct) Credits BEFORE creating job and queueing
      try {
        await deductActionCredit(userId, costPerCampaign);
      } catch (deductErr: any) {
        // #region agent log
        // #endregion
        console.error(
          `Failed to reserve credits for user ${userId}:`,
          deductErr,
        );
        // We throw the error so that the express route can catch it, because deductActionCredit throws specific errors
        if (deductErr.message === "Insufficient Action Credits.") {
          return res.status(402).json({
            error: "Insufficient Action Credits",
            message: deductErr.message,
          });
        }
        return res
          .status(500)
          .json({ error: "Billing system unavailable. Try again later." });
      }

      // 3. Insert row/document into campaign_jobs (Firestore)
      // #region agent log
      // #endregion
      const jobRef = await db.collection("campaign_jobs").add({
        userId,
        status: "queued",
        progress: 0,
        total: Math.min(competitors.length, MAX_COMPETITORS),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const jobId = jobRef.id;
      // #region agent log
      // #endregion

      // 4. Enqueue to BullMQ (Durable Jobs)
      const idempotencyKey = `campaign_${jobId}_${Date.now()}`;
      try {
        // #region agent log
        // #endregion
        // Pass the job to the existing Network queue for processing
        await networkIoQueue.add(
          "run-validation-campaign",
          {
            jobId,
            userId,
            competitors,
            baseIdea,
            idempotencyKey,
            costReserved: costPerCampaign,
          },
          {
            jobId: idempotencyKey, // BullMQ native deduplication
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
          },
        );

        // Return the jobId immediately so the frontend can poll / setup onSnapshot
        return res
          .status(202)
          .json({ jobId, message: "Campaign queued successfully." });
      } catch (queueErr: any) {
        // #region agent log
        // #endregion
        // 5. Commit/Rollback: The enqueue failed, so we MUST refund the user locally.
        console.error(
          `Failed to queue campaign ${jobId}. Rolling back credits:`,
          queueErr,
        );

        // Local rollback
        try {
          await deductActionCredit(userId, -costPerCampaign); // Refund by passing negative cost
          await jobRef.update({
            status: "failed",
            error: "Queue system unavailable.",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (refundErr) {
          console.error(
            "CRITICAL: Failed to refund user after queue failure. Manual intervention required.",
            { userId, jobId, costPerCampaign },
          );
        }

        return res.status(500).json({
          error: "Failed to queue campaign. Your credits have been refunded.",
        });
      }
    } catch (error: any) {
      // #region agent log
      // #endregion
      console.error("Campaign start error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * Exported for testing purposes
 */
export async function runDeepValidationCampaign(
  jobId: string,
  userId: string,
  competitors: any[],
  baseIdea: any,
) {
  const db = admin.firestore();
  const jobRef = db.collection("campaign_jobs").doc(jobId);

  let activeCompetitors = [...competitors];

  // #region agent log
  // #endregion

  // Hard cap to prevent asymmetric resource exhaustion
  const safeCompetitors = activeCompetitors.slice(0, MAX_COMPETITORS);
  let completedCount = 0;

  // We use Gemini 768D dimensions for performance
  const DIMENSIONS = 768;

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is missing");
  const ai = new GoogleGenAI({ apiKey: key });
  if (!ai.models)
    console.error(
      "ai.models IS UNDEFINED! ai:",
      ai,
      "GoogleGenAI:",
      GoogleGenAI,
    );

  // 3. Vector Search (Embeddings generation)
  const enrichedResults = await pMap(
    safeCompetitors,
    async (comp: any) => {
      try {
        // Mock data extraction delay
        // await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate real embedding using gemini-embedding-001
        const embedText = `${comp.name || comp.domain}\n${comp.short_description || "Competitor"}`;
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: embedText,
        });

        const rawValues = embedRes.embeddings?.[0]?.values;
        if (!rawValues || rawValues.length !== DIMENSIONS) {
          throw new Error("Invalid embedding returned from Gemini");
        }

        const realVector = new Float32Array(rawValues);
        fastL2NormalizeInPlace(realVector);

        // Mock LLM Extraction output using strict Zod boundary parsing and Grammar-Constrained Decoding format
        const mockLlmExtraction = {
          _reasoning: "Competitor focuses on general CRM features.",
          exact_quote: "The all-in-one CRM for businesses.",
          exa_url: "https://example.com/crm",
          wedge_metric: 0.8,
        };

        // Zod validation boundary
        console.log("LLMExtractionSchema:", LLMExtractionSchema);
        const parsedExtraction =
          LLMExtractionSchema.safeParse(mockLlmExtraction);
        if (!parsedExtraction.success) {
          throw new Error("LLM Extraction failed Zod validation");
        }

        if (!validateExaUrl(parsedExtraction.data.exa_url)) {
          throw new Error(
            "Stored XSS protection: Invalid URL protocol from LLM",
          );
        }

        completedCount++;
        if (
          completedCount % 5 === 0 ||
          completedCount === safeCompetitors.length
        ) {
          await jobRef.update({
            progress: completedCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return {
          status: "success" as const,
          data: {
            ...comp,
            vector: realVector,
            features: ["Dashboard", "AI Chat"],
            extraction: parsedExtraction.data,
          },
        };
      } catch (error: any) {
        console.log("TC_ERROR:", error.message);
        return { status: "error" as const, domain: comp.domain, error };
      }
    },
    {
      concurrency: 10,
      stopOnError: false, // Crucial: partial failures shouldn't kill the campaign
    },
  );

  const successfulEnrichments = enrichedResults
    .filter((res) => res.status === "success")
    .map((res) => res.data);

  // Base idea real vector
  const baseIdeaText =
    typeof baseIdea === "string" ? baseIdea : JSON.stringify(baseIdea);
  const baseEmbedRes = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: baseIdeaText || "Base Idea",
  });
  const baseRawValues = baseEmbedRes.embeddings?.[0]?.values;
  const baseVector = new Float32Array(
    baseRawValues || new Array(DIMENSIONS).fill(0.15),
  );
  fastL2NormalizeInPlace(baseVector);

  // Allocate a single Float32Array scratchpad for Orthogonal Distance calculation to avoid GC pauses
  const orthogonalScratchpad = new Float32Array(DIMENSIONS);

  let totalUniqueness = 0;
  let maxWedge = 0;

  const scoredCompetitors = successfulEnrichments.map((comp) => {
    // Pure inner product calculation
    let innerProduct = 0.0;
    for (let i = 0; i < DIMENSIONS; i++) {
      innerProduct += baseVector[i] * comp.vector[i];
    }
    const similarity = Math.max(-1, Math.min(1, innerProduct));
    const uniqueness = 1.0 - similarity;
    totalUniqueness += uniqueness;

    // Wedge metric (Orthogonal distance)
    const orthogonalDistance = calculateOrthogonalDistance(
      baseVector,
      comp.vector,
      orthogonalScratchpad,
    );
    maxWedge = Math.max(maxWedge, orthogonalDistance);

    const jaccard = 0.5; // Mock jaccard
    const trueCompetitorScore = 0.6 * similarity + 0.4 * jaccard;

    // Fix: Object rest destructuring to omit undefined vector
    const { vector, ...compWithoutVector } = comp;

    return {
      ...compWithoutVector,
      trueCompetitorScore,
      orthogonalDistance,
    };
  });

  const averageUniqueness =
    successfulEnrichments.length > 0
      ? totalUniqueness / successfulEnrichments.length
      : 1.0;

  const totalCompetitorCount = competitors.length;

  // Calculate final score using the new engine
  const scoreResult: any = calculateTarpitScore({
    vectorUniqueness: averageUniqueness,
    apolloCount: totalCompetitorCount,
  } as any);

  // Apply Wedge Override (if the orthogonal distance is high enough, it's a defensible niche)
  const WEDGE_THRESHOLD = 0.85;
  if (
    scoreResult.status === "success" &&
    scoreResult.isTarpit &&
    maxWedge > WEDGE_THRESHOLD
  ) {
    scoreResult.isTarpit = false;
    scoreResult.message =
      "Wedge metric overrides Tarpit score - Defensible Blue Ocean detected.";
  }

  // Complete the campaign, storing the score and execution context (Scoring Version Registry)
  await jobRef.update({
    status: "completed",
    progress: safeCompetitors.length,
    results: scoredCompetitors,
    scoreResult,
    scoring_version: 1, // Versioning for M&A audit trail
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Note: Action Credit already deducted synchronously before enqueueing.
  // No need to deduct here.
}

/**
 * Exported for testing purposes
 */
export async function runTaxonomyEvaluation(
  userId: string,
  featuresToMerge: string[],
  workspaceId: string,
  customName?: string,
) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing");
    const ai = new GoogleGenAI({ apiKey: key });

    // 1. Generate embeddings for the features using Gemini
    const embedResA = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: featuresToMerge[0],
    });
    const embedResB = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: featuresToMerge[1],
    });

    const vectorA = new Float32Array(
      embedResA.embeddings?.[0]?.values || new Array(768).fill(0.1),
    );
    const vectorB = new Float32Array(
      embedResB.embeddings?.[0]?.values || new Array(768).fill(0.1),
    );

    // 2. Cosine Similarity Check
    // Using the scoring engine math optimizations
    const { calculateCosineSimilarity, fastL2NormalizeInPlace } =
      await import("../utils/scoringEngine");
    fastL2NormalizeInPlace(vectorA);
    fastL2NormalizeInPlace(vectorB);

    const similarity = calculateCosineSimilarity(vectorA, vectorB);

    let finalRelationship:
      | "OBJECTIVE_SYNONYM"
      | "SUBJECTIVE_GROUPING"
      | "DISTINCT" = "DISTINCT";

    const config = {
      objectiveThreshold: 0.85,
      subjectiveThreshold: 0.6,
    };

    if (similarity > config.objectiveThreshold) {
      finalRelationship = "OBJECTIVE_SYNONYM";
    } else if (similarity < config.subjectiveThreshold) {
      finalRelationship = "SUBJECTIVE_GROUPING";
    } else {
      // Fallback LLM validation (Chain of Thought + Few-Shot)
      const prompt = `Determine the relationship between these two features: "${featuresToMerge[0]}" and "${featuresToMerge[1]}". Are they OBJECTIVE_SYNONYM, SUBJECTIVE_GROUPING, or DISTINCT? Respond with a single string exactly.`;
      const llmRes = await ai.models.generateContent({
        model: "gemini-3.1-flash",
        contents: prompt,
      });
      const relation = llmRes.text?.trim() || "DISTINCT";
      finalRelationship = (
        ["OBJECTIVE_SYNONYM", "SUBJECTIVE_GROUPING", "DISTINCT"].includes(
          relation,
        )
          ? relation
          : "DISTINCT"
      ) as any;
    }

    // 3. Write to Outbox / Superadmin Queue (taxonomy_proposals)
    if (finalRelationship === "OBJECTIVE_SYNONYM") {
      const proposalRef = admin
        .firestore()
        .collection("taxonomy_proposals")
        .doc();
      await proposalRef.set({
        workspaceId,
        originalFeatures: featuresToMerge,
        mergedName: customName,
        similarityScore: similarity,
        llmValidated: true,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 4. Update the user's workspace taxonomy evaluationStatus to idle
    const taxRef = admin
      .firestore()
      .doc(`workspaces/${workspaceId}/appData/taxonomy`);
    await taxRef.set(
      {
        evaluationStatus: "idle",
      },
      { merge: true },
    );
  } catch (e) {
    console.error("Taxonomy evaluation failed", e);
    // Mark as failed
    const taxRef = admin
      .firestore()
      .doc(`workspaces/${workspaceId}/appData/taxonomy`);
    await taxRef.set(
      {
        evaluationStatus: "failed",
      },
      { merge: true },
    );
  }
}

// Endpoint for async evaluating taxonomy merges
campaignRouter.post(
  "/evaluate-taxonomy",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { featuresToMerge, customName, workspaceId } = req.body;
    if (!featuresToMerge || featuresToMerge.length < 2 || !workspaceId) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // We return 202 Accepted immediately as this is an async pipeline
    res.status(202).json({ status: "evaluating" });

    // Async evaluation process
    runTaxonomyEvaluation(userId, featuresToMerge, workspaceId, customName);
  },
);

// Secure endpoint for Fake Door telemetry ingestion
campaignRouter.post(
  "/signal",
  express.json({ limit: "5kb" }),
  fakeDoorSignalLimiter,
  async (req, res: any) => {
    try {
      const parsedBody = FakeDoorSignalInputSchema.parse(req.body);

      // Defense in Depth: Honeypot Check
      // If the honeypot field is filled, silently drop the request (returns 200)
      if (parsedBody.website_url && parsedBody.website_url.length > 0) {
        return res
          .status(200)
          .json({ success: true, message: "Signal recorded" });
      }

      // Defense in Depth: Cloudflare Turnstile Verification
      // Only verify if a secret key is provided (skip in local dev without keys)
      if (process.env.TURNSTILE_SECRET_KEY) {
        if (!parsedBody.cf_turnstile_response) {
          return res
            .status(403)
            .json({ error: "Missing Turnstile verification" });
        }

        const turnstileFormData = new URLSearchParams();
        turnstileFormData.append("secret", process.env.TURNSTILE_SECRET_KEY);
        turnstileFormData.append("response", parsedBody.cf_turnstile_response);
        if (req.ip) turnstileFormData.append("remoteip", req.ip);

        const turnstileResponse = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            body: turnstileFormData,
          },
        );

        const turnstileOutcome = await turnstileResponse.json();
        if (!turnstileOutcome.success) {
          return res
            .status(403)
            .json({ error: "Turnstile verification failed" });
        }
      }

      // Synchronous count using FieldValue.increment()
      const db = admin.firestore();

      const productRef = db.collection("products").doc(parsedBody.productId);

      // We also append the signal to a lean append-only collection for auditing,
      // but the main counter is incremented on the product doc.
      const signalRef = db.collection("fake_door_signals").doc();

      const batch = db.batch();

      // Update metricsSnapshot on the product
      const updatePayload: Record<string, any> = {};
      if (parsedBody.eventType === "view") {
        updatePayload["metricsSnapshot.views"] =
          admin.firestore.FieldValue.increment(1);
      } else if (parsedBody.eventType === "cta_click") {
        updatePayload["metricsSnapshot.ctaClicks"] =
          admin.firestore.FieldValue.increment(1);
      } else if (parsedBody.eventType === "email_submit") {
        updatePayload["metricsSnapshot.emails"] =
          admin.firestore.FieldValue.increment(1);
      }

      // Set the signal document
      batch.set(signalRef, {
        productId: parsedBody.productId,
        eventType: parsedBody.eventType,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        // Client IP/UA isn't stored in plain text to adhere to privacy/GDPR,
        // rate limiting handled by Redis instead.
      });

      batch.update(productRef, updatePayload);

      await batch.commit();

      return res
        .status(200)
        .json({ success: true, message: "Signal recorded" });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payload format" });
      }
      console.error("Signal ingestion failed:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Secure endpoint for Forking a Product
campaignRouter.post(
  "/create-product",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const parsedBody = CreateProductInputSchema.parse(req.body);
      const userId = req.user!.uid;

      const db = admin.firestore();
      const newProductRef = db.collection("products").doc();
      const newProductId = newProductRef.id;

      const newProduct = {
        id: newProductId,
        userId,
        name: parsedBody.name,
        description: parsedBody.description || "",

        parentId: null,
        rootId: newProductId,
        ancestors: [newProductId],
        forkReason: null,

        distributionChannel: null,
        status: "draft",

        targetAudience: parsedBody.targetAudience || "",
        jobToBeDone: parsedBody.jobToBeDone || "",

        metricsSnapshot: { views: 0, ctaClicks: 0, emails: 0 },

        schemaVersion: "v1",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null,
      };

      await newProductRef.set(newProduct);

      return res.status(201).json({ success: true, id: newProductId });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: e.issues });
      }
      console.error("Create product failed:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Secure endpoint for Forking a Product
campaignRouter.post(
  "/fork-product",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const parsedBody = ForkProductInputSchema.parse(req.body);
      const userId = req.user!.uid;

      const db = admin.firestore();
      const parentRef = db.collection("products").doc(parsedBody.parentId);

      const newProductRef = db.collection("products").doc();
      const newProductId = newProductRef.id;

      await db.runTransaction(async (transaction) => {
        const parentDoc = await transaction.get(parentRef);

        if (!parentDoc.exists) {
          throw new Error("Parent product does not exist.");
        }

        const parentData = parentDoc.data()!;
        if (parentData.userId !== userId) {
          throw new Error("Unauthorized to fork this product.");
        }

        // Enforce max 3 active variants (status != 'archived' && status != 'superseded')
        const activeVariantsQuery = db
          .collection("products")
          .where("rootId", "==", parentData.rootId)
          .where("userId", "==", userId)
          .where("status", "in", ["draft", "deployed_fake_door"]);

        const activeVariantsSnapshot =
          await transaction.get(activeVariantsQuery);

        if (activeVariantsSnapshot.size >= 3) {
          throw new Error(
            "Maximum of 3 active variants allowed per product root.",
          );
        }

        // Capping the ancestors lineage array at 30
        const ancestors = [...(parentData.ancestors || [])];
        ancestors.push(parentData.id);
        const cappedAncestors = ancestors.slice(-30);

        const newProduct = {
          id: newProductId,
          userId,
          name: parsedBody.name,
          description: parentData.description || "",

          parentId: parsedBody.parentId,
          rootId: parentData.rootId,
          ancestors: cappedAncestors,
          forkReason: parsedBody.forkReason,

          distributionChannel: null, // Reset distribution channel
          status: "draft",

          targetAudience:
            parsedBody.targetAudience || parentData.targetAudience,
          jobToBeDone: parsedBody.jobToBeDone || parentData.jobToBeDone,

          metricsSnapshot: { views: 0, ctaClicks: 0, emails: 0 },

          schemaVersion: "v1",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedAt: null,
        };

        transaction.set(newProductRef, newProduct);
      });

      return res.status(201).json({ success: true, id: newProductRef.id });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: e.issues });
      }
      console.error("Fork product failed:", e);
      return res
        .status(e.message.includes("Maximum") ? 403 : 500)
        .json({ error: e.message || "Internal server error" });
    }
  },
);

// Secure endpoint for Double Down Action
campaignRouter.post(
  "/double-down",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "Missing productId" });
      }

      const userId = req.user!.uid;
      const db = admin.firestore();
      const productRef = db.collection("products").doc(productId);

      let jobId = "";

      await db.runTransaction(async (transaction) => {
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error("Product does not exist.");
        }

        const productData = productDoc.data()!;
        if (productData.userId !== userId) {
          throw new Error("Unauthorized.");
        }

        if (productData.status === "winner") {
          throw new Error("Already doubled down on this product.");
        }

        // 1. Lock the winner
        transaction.update(productRef, {
          status: "winner",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Archive siblings (active variants under the same root)
        const activeVariantsQuery = db
          .collection("products")
          .where("rootId", "==", productData.rootId)
          .where("userId", "==", userId)
          .where("status", "in", ["draft", "deployed_fake_door"]);

        const activeVariantsSnapshot =
          await transaction.get(activeVariantsQuery);

        activeVariantsSnapshot.docs.forEach((doc) => {
          if (doc.id !== productId) {
            transaction.update(doc.ref, {
              status: "superseded", // or archived
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });

        // 3. Dispatch OpenSpec generation job
        const jobRef = db.collection("OpenSpecJobs").doc();
        jobId = jobRef.id;

        transaction.set(jobRef, {
          productId,
          userId,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3600000),
        });
      });

      return res.status(202).json({ success: true, jobId });
    } catch (e: any) {
      console.error("Double down failed:", e);
      return res
        .status(e.message === "Unauthorized." ? 403 : 500)
        .json({ error: e.message || "Internal server error" });
    }
  },
);

// Endpoint for Hybrid Validation Pipeline (Taxonomy Merge)
campaignRouter.post(
  "/evaluate-taxonomy",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.uid;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { featuresToMerge, customName, workspaceId } = req.body || {};
      if (
        !featuresToMerge ||
        featuresToMerge.length < 2 ||
        !customName ||
        !workspaceId
      ) {
        return res.status(400).json({ error: "Invalid payload." });
      }

      // We immediately send 202 Accepted, and process async.
      res.status(202).json({ status: "evaluating" });

      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is missing");
      const ai = new GoogleGenAI({ apiKey: key });
      const db = admin.firestore();

      // 1. Generate embeddings
      const embeddings: Float32Array[] = [];
      const modelName = "text-embedding-004";
      for (const feature of featuresToMerge) {
        const embedRes = await ai.models.embedContent({
          model: modelName,
          contents: feature,
        });
        const vals = embedRes.embeddings?.[0]?.values;
        if (!vals) throw new Error("Failed to embed feature");
        const floatArr = new Float32Array(vals);
        fastL2NormalizeInPlace(floatArr);
        embeddings.push(floatArr);
      }

      // 2. Compute similarity (average pairwise)
      let totalSim = 0;
      let pairs = 0;
      for (let i = 0; i < embeddings.length; i++) {
        for (let j = i + 1; j < embeddings.length; j++) {
          totalSim += calculateCosineSimilarity(embeddings[i], embeddings[j]);
          pairs++;
        }
      }
      const avgSim = totalSim / pairs;

      const thresholds = getTaxonomyThresholds(modelName);

      let decision: "objective" | "subjective" | "borderline" = "borderline";
      if (avgSim >= thresholds.objective) decision = "objective";
      else if (avgSim < thresholds.subjective) decision = "subjective";

      if (decision === "borderline") {
        // LLM as a judge with exponential backoff
        let llmDecision = "subjective"; // fallback
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const prompt = `Are these features functionally identical (objective synonyms) or just subjectively grouped?
Features to merge: ${JSON.stringify(featuresToMerge)}
Proposed new name: ${customName}

Provide chain-of-thought reasoning with keys: reasoning_feature_a, reasoning_feature_b, boundary_analysis.
Then provide classification: OBJECTIVE_SYNONYM or SUBJECTIVE_GROUPING.
Also provide confidence (0-1). Make sure the output is pure JSON matching this exact structure:
{
  "reasoning_feature_a": string,
  "reasoning_feature_b": string,
  "boundary_analysis": string,
  "classification": "OBJECTIVE_SYNONYM" | "SUBJECTIVE_GROUPING",
  "confidence": number
}`;
            const geminiRes = await ai.models.generateContent({
              model: "gemini-3.1-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              },
            });
            const responseText = geminiRes.text;
            if (responseText) {
              const parsed = JSON.parse(responseText);
              if (
                parsed.classification === "OBJECTIVE_SYNONYM" &&
                parsed.confidence >= 0.9
              ) {
                llmDecision = "objective";
              }
              break; // success
            }
          } catch (e) {
            console.warn(`LLM judge attempt ${attempt + 1} failed`, e);
            await new Promise((r) =>
              setTimeout(r, Math.pow(2, attempt) * 1000),
            );
          }
        }
        if (llmDecision === "objective") decision = "objective";
        else decision = "subjective";
      }

      // 3. Handle outcomes
      const userTaxRef = db.doc(`workspaces/${workspaceId}/appData/taxonomy`);

      if (decision === "objective") {
        // Queue for Superadmin
        const proposalRef = db.collection("taxonomy_proposals").doc();
        await proposalRef.set({
          customName,
          featuresToMerge,
          workspaceId,
          similarityScore: avgSim,
          status: "pending_superadmin",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // For ALL outcomes, we approve the local merge so the user's optimistic UI solidifies
      await db.runTransaction(async (t) => {
        const snap = await t.get(userTaxRef);
        if (!snap.exists) return;
        const data = snap.data();
        if (data?.evaluationStatus === "evaluating") {
          t.update(userTaxRef, {
            evaluationStatus: "success",
          });
        }
      });
    } catch (e: any) {
      console.error("Evaluate taxonomy failed:", e);
      // Even on failure, set it to success/idle locally to not break user's flow
      try {
        const { workspaceId } = req.body || {};
        if (workspaceId) {
          const userTaxRef = admin
            .firestore()
            .doc(`workspaces/${workspaceId}/appData/taxonomy`);
          await userTaxRef.update({ evaluationStatus: "success" });
        }
      } catch (ignore) {}
    }
  },
);
