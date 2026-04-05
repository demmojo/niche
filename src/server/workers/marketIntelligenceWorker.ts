import Exa from "exa-js";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import {
  CompetitorExtractionSchema,
  DerivedInsightExtractionSchema,
  JobToBeDoneExtractionSchema,
  PROMPTS,
  sanitizeForXml,
} from "../../utils/aiSchemas";
import { calculateHeuristicScores } from "../scoringHeuristics";

// Initialize Firebase Admin if not already initialized
if (!admin.apps?.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const processMarketIntelligenceJob = async (jobData: any) => {
  const { jobId, targetUrl, extractionType, userId } = jobData;
  const jobRef = db.collection("TaxonomyJobs").doc(jobId);

  const controller = new AbortController();
  const signal = controller.signal;

  try {
    await jobRef.update({ status: "processing", progress: 10 });

    // 1. Exa Search (2026 SDK includes contents by default)
    const exaKey = process.env.EXA_API_KEY;
    if (!exaKey) throw new Error("EXA_API_KEY is missing");
    const exa = new Exa(exaKey);

    await jobRef.update({ status: "scraping", progress: 20 });

    const searchResults = await exa.search(targetUrl, {
      type: "neural",
      numResults: 1,
      contents: { text: { maxCharacters: 15000 } },
    });

    if (signal.aborted) throw new Error("Job aborted");

    const contextText = searchResults.results?.[0]?.text || "";
    if (!contextText) throw new Error("No readable content found at URL.");

    await jobRef.update({ status: "extracting", progress: 50 });

    // 2. Gemini Extraction
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    let model = "gemini-3.1-flash";
    let prompt = "";
    let schema: any;

    switch (extractionType) {
      case "competitor":
        prompt = PROMPTS.EXTRACT_COMPETITOR_METADATA;
        schema = (CompetitorExtractionSchema.options[0] as any).toJSONSchema();
        break;
      case "insight":
        prompt = PROMPTS.EXTRACT_DERIVED_INSIGHTS;
        schema = (
          DerivedInsightExtractionSchema.options[0] as any
        ).toJSONSchema();
        model = "gemini-3.1-pro-preview"; // Use Pro for complex insights
        break;
      case "jtbd":
        prompt = PROMPTS.EXTRACT_JTBD;
        schema = (JobToBeDoneExtractionSchema.options[0] as any).toJSONSchema();
        model = "gemini-3.1-pro-preview"; // Use Pro for JTBD
        break;
      default:
        throw new Error(`Unknown extraction type: ${extractionType}`);
    }

    const safeContext = sanitizeForXml(contextText);
    const fullPrompt = `${prompt}\n\n<context>\n${safeContext}\n</context>`;

    if (signal.aborted) throw new Error("Job aborted");

    const geminiRes = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You must return valid JSON matching this schema: ${JSON.stringify(schema)}`,
      },
    });

    if (signal.aborted) throw new Error("Job aborted");

    const responseText = geminiRes.text || "{}";
    const extractedData =
      typeof responseText === "string"
        ? JSON.parse(responseText)
        : responseText;

    let confidenceScore = extractedData.confidenceScore || 0.85;

    // Apply Heuristic Scoring if Competitor
    if (extractionType === "competitor") {
      const scores = calculateHeuristicScores(extractedData);
      extractedData.competitorScore = scores.competitorScore;
      extractedData.trustScore = scores.trustScore;
      confidenceScore = scores.confidenceThreshold;
    }

    // 3. Save to Taxonomy Queue for HITL review
    const taxonomyEntry = {
      userId,
      extractionType,
      targetUrl,
      extractedData,
      status: "pending_review",
      confidenceScore,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "Exa + Gemini",
    };

    const inboxRef = await db.collection("TaxonomyInbox").add(taxonomyEntry);

    await jobRef.update({
      status: "completed",
      progress: 100,
      resultId: inboxRef.id,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, resultId: inboxRef.id };
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);
    await jobRef.update({
      status: "failed",
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw error;
  }
};
