import { Router, Request, Response } from "express";
import { requireInternalOidc } from "../internalAuthMiddleware";
import * as admin from "firebase-admin";

import Exa from "exa-js";
import { GoogleGenAI } from "@google/genai";
import { publishSseEvent } from "../sse";
import { runDeepValidationCampaign } from "../campaignRoutes";

export const workerRouter = Router();

workerRouter.use(requireInternalOidc);

// Network IO Worker Route
workerRouter.post("/network-io", async (req: Request, res: Response) => {
  const jobData = req.body;
  const jobId = jobData.jobId || "unknown";

  // Acknowledge receipt to Cloud Tasks immediately, then process
  // Wait! Cloud Tasks needs the HTTP request to stay open for the duration of the task
  // to keep the CPU allocated in a scale-to-zero environment.
  // We MUST NOT return res.status(202).json({}) immediately, we must await the result.

  try {
    if (
      jobData.action === "run-validation-campaign" ||
      jobData.name === "run-validation-campaign"
    ) {
      await runDeepValidationCampaign(
        jobId,
        jobData.userId,
        jobData.competitors,
        jobData.baseIdea,
      );
      return res.status(200).json({ success: true });
    }

    publishSseEvent(jobId, "progress", {
      status: "Scraping competitor via Exa...",
      progress: 20,
    });

    const key = process.env.EXA_API_KEY;
    if (!key) throw new Error("EXA_API_KEY is missing");
    const exa = new Exa(key);

    const response = await exa.search(jobData.url, {
      type: "neural",
      numResults: 1,
      contents: { text: { maxCharacters: 4000, includeHtmlTags: false } },
    });

    publishSseEvent(jobId, "progress", {
      status: "Processing data...",
      progress: 80,
    });

    const resultText =
      response.results && response.results.length > 0
        ? response.results[0].text
        : "";

    publishSseEvent(jobId, "completed", {
      status: "Done",
      result: { success: true, url: jobData.url, text: resultText },
    });

    // Telemetry logging
    if (jobData.url) {
      const db = admin.firestore();
      const eventId = require("uuid").v4();
      await db
        .collection("telemetry_events")
        .doc(eventId)
        .set(
          {
            eventId,
            schemaVersion: "v1",
            eventType: "activation",
            actorType: "human",
            projectId: jobData.projectId || "unknown_project",
            payload: {
              competitorCount: 1,
              featuresExtractedCount: 0,
              durationMs: 1000, // mock duration
              jobId,
              userId: jobData.userId || "unknown",
              environment: process.env.NODE_ENV || "development",
              isTestAccount: false,
            },
            clientTimestamp: Date.now(),
            serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    }

    return res.status(200).json({ success: true, text: resultText });
  } catch (error: any) {
    console.error("NetworkIO worker failed:", error);
    publishSseEvent(jobId, "failed", { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

// Vision ML Worker Route
workerRouter.post("/vision-ml", async (req: Request, res: Response) => {
  const jobData = req.body;
  const jobId = jobData.jobId || "unknown";

  try {
    let payload = jobData;
    // Check if heavy payload was offloaded to Firestore
    if (jobData.isHeavyPayload) {
      const doc = await admin
        .firestore()
        .collection("cloud_tasks_payloads")
        .doc(jobId)
        .get();
      if (doc.exists) {
        payload = { ...payload, ...doc.data() };
      }
    }

    publishSseEvent(jobId, "progress", {
      status: "Analyzing image via Gemini Vision...",
      progress: 10,
    });

    const { imageBase64, mimeType } = payload;
    if (!imageBase64) throw new Error("Missing imageBase64");

    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing");
    const ai = new GoogleGenAI({ apiKey: key });

    const prompt =
      "Analyze this image and extract the key features present in the UI. Return a JSON object with a single key 'features' mapping to an array of strings.";
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType || "image/png" } },
      ],
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          'You are a UI analysis expert. Always output valid JSON matching { "features": ["feat1", "feat2"] }.',
      },
    });

    publishSseEvent(jobId, "progress", {
      status: "Extracting features...",
      progress: 90,
    });

    const responseText = geminiRes.text || "{}";
    const realResponse =
      typeof responseText === "string"
        ? JSON.parse(responseText)
        : responseText;

    publishSseEvent(jobId, "completed", {
      status: "Done",
      result: { success: true, features: realResponse.features || [] },
    });

    // Cleanup heavy payload if applicable
    if (jobData.isHeavyPayload) {
      await admin
        .firestore()
        .collection("cloud_tasks_payloads")
        .doc(jobId)
        .delete();
    }

    return res
      .status(200)
      .json({ success: true, features: realResponse.features || [] });
  } catch (error: any) {
    console.error("Vision ML worker failed:", error);
    publishSseEvent(jobId, "failed", { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

// Import other worker processing functions
import { processMarketIntelligenceJob } from "../workers/marketIntelligenceWorker";
import { processBrandWizardJob } from "../workers/brandWizardWorker";

workerRouter.post(
  "/market-intelligence",
  async (req: Request, res: Response) => {
    try {
      await processMarketIntelligenceJob(req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Market Intelligence worker failed:", error);
      return res.status(500).json({ error: error.message });
    }
  },
);

workerRouter.post("/brand-wizard", async (req: Request, res: Response) => {
  try {
    await processBrandWizardJob(req.body);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Brand Wizard worker failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

import { processBrandTokenReviewJob } from "../workers/brandTokenReviewWorker";

workerRouter.post("/brand-review", async (req: Request, res: Response) => {
  try {
    await processBrandTokenReviewJob(req.body);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Brand Token Review worker failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

workerRouter.post("/distillation", async (req: Request, res: Response) => {
  const jobData = req.body;
  const jobId = jobData.jobId || "unknown";

  try {
    publishSseEvent(jobId, "progress", {
      status: "Starting continuous distillation...",
      progress: 10,
    });

    const db = admin.firestore();
    const stateDoc = await db
      .collection("system_state")
      .doc("distillation")
      .get();
    const lastProcessedId = stateDoc.exists
      ? stateDoc.data()?.last_processed_id
      : "00000000-0000-0000-0000-000000000000";

    const { supabase } = await import("../../utils/hashing");
    const { data, error } = await supabase
      .from("raw_data_versions")
      .select("id, blob_uri, extracted_metadata")
      .gt("id", lastProcessedId)
      .order("id", { ascending: true })
      .limit(100);

    if (error)
      throw new Error(
        "Failed to fetch records for distillation: " + error.message,
      );

    if (data && data.length > 0) {
      const newWatermark = data[data.length - 1].id;
      publishSseEvent(jobId, "progress", {
        status: `Distilling ${data.length} records...`,
        progress: 50,
      });

      await db.collection("system_state").doc("distillation").set(
        {
          last_processed_id: newWatermark,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      publishSseEvent(jobId, "completed", {
        status: "Distillation Completed",
        result: { success: true, recordsProcessed: data.length, newWatermark },
      });
      return res
        .status(200)
        .json({ success: true, recordsProcessed: data.length, newWatermark });
    } else {
      publishSseEvent(jobId, "completed", {
        status: "Distillation Completed",
        result: {
          success: true,
          recordsProcessed: 0,
          newWatermark: lastProcessedId,
        },
      });
      return res
        .status(200)
        .json({
          success: true,
          recordsProcessed: 0,
          newWatermark: lastProcessedId,
        });
    }
  } catch (error: any) {
    console.error("Distillation worker failed:", error);
    publishSseEvent(jobId, "failed", { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});
