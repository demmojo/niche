import * as adminNamespace from "firebase-admin";
const admin = adminNamespace;
import { GoogleGenAI } from "@google/genai";
import { mlConfigCache } from "../mlConfigCache";
import pMap from "p-map";
import {
  calculateTarpitScore,
  calculateSquaredOrthogonalDistance,
  fastL2NormalizeInPlace,
  LLMExtractionSchema,
  validateExaUrl,
} from "../../utils/scoringEngine";

const MAX_COMPETITORS = 100;

export async function runDeepValidationCampaign(
  jobId: string,
  userId: string,
  competitors: any[],
  baseIdea: any,
) {
  const db = admin.firestore();
  const jobRef = db.collection("campaign_jobs").doc(jobId);

  let activeCompetitors = [...competitors];

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

  const routedConfig = await mlConfigCache.route("cfg_validation_campaign");
  const genModel = routedConfig?.modelParams.model || "gemini-3.1-flash";
  const embedModel =
    routedConfig?.modelParams.embeddingModel || "gemini-embedding-001";

  // 3. Vector Search (Embeddings generation)
  const enrichedResults = await pMap(
    safeCompetitors,
    async (comp: any) => {
      try {
        // Mock data extraction delay
        // await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate real embedding using routed embedding model
        const embedText = `${comp.name || comp.domain}\n${comp.short_description || "Competitor"}`;
        const embedRes = await ai.models.embedContent({
          model: embedModel,
          contents: embedText,
        });

        const rawValues = embedRes.embeddings?.[0]?.values;
        if (!rawValues || rawValues.length !== DIMENSIONS) {
          throw new Error("Invalid embedding returned from Gemini");
        }

        const realVector = new Float32Array(rawValues);
        fastL2NormalizeInPlace(realVector);

        // Real LLM Extraction using structured JSON generation
        const promptText = `Extract structured validation data for the following competitor.
Base Idea: ${typeof baseIdea === "string" ? baseIdea : JSON.stringify(baseIdea)}
Competitor: ${JSON.stringify(comp)}

You must return valid JSON matching the following schema exactly:
{
  "jtbd": { "job_statement": "string", "importance": 0, "satisfaction": 0 },
  "market_gaps": ["string", "string"],
  "_reasoning": "string explanation",
  "exact_quote": "string quote from competitor",
  "exa_url": "string url",
  "wedge_metric": 0.8
}
Ensure importance and satisfaction are between 0 and 10, and wedge_metric is between 0 and 1.`;

        const llmRes = await ai.models.generateContent({
          model: genModel,
          contents: promptText,
          config: {
            temperature: routedConfig?.modelParams.temperature,
            topP: routedConfig?.modelParams.topP,
            responseMimeType: "application/json",
            systemInstruction:
              "You are an expert market analyst extracting structured competitor data. Always return valid JSON.",
          },
        });

        let extractedData;
        try {
          extractedData = JSON.parse(llmRes.text || "{}");
        } catch (e) {
          console.error("Failed to parse LLM Extraction JSON:", e);
          throw new Error("Invalid JSON from LLM");
        }

        // Zod validation boundary
        console.log("LLMExtractionSchema:", LLMExtractionSchema);
        const parsedExtraction = LLMExtractionSchema.safeParse(extractedData);
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
    model: embedModel,
    contents: baseIdeaText || "Base Idea",
  });
  const baseRawValues = baseEmbedRes.embeddings?.[0]?.values;
  const baseVector = new Float32Array(
    baseRawValues || new Array(DIMENSIONS).fill(0.15),
  );
  fastL2NormalizeInPlace(baseVector);

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
    const orthogonalDistanceSq = calculateSquaredOrthogonalDistance(
      baseVector,
      comp.vector,
    );
    const orthogonalDistance = Math.sqrt(orthogonalDistanceSq); // Take sqrt here since downstream expects the actual distance
    maxWedge = Math.max(maxWedge, orthogonalDistance);

    const jaccard = 0.5; // Mock jaccard
    const trueCompetitorScore = 0.6 * similarity + 0.4 * jaccard;

    // Fix: Object rest destructuring to omit undefined vector
    const { vector, ...compWithoutVector } = comp as any;

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
      "[System Override] Wedge metric overrides Tarpit score - Defensible Blue Ocean detected.";
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
