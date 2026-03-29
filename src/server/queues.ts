import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import * as dotenv from "dotenv";
import { publishSseEvent } from "./sse";
import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;

dotenv.config();

// Initialize Redis connection
// In production, use the REDIS_URL from env
export const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null, // Required by BullMQ
  },
);

// Create Queues
export const networkIoQueue = new Queue("network-io-queue", { connection });
export const visionMlQueue = new Queue("vision-ml-queue", { connection });
export const brandWizardQueue = new Queue("brand-wizard-queue", { connection });
export const brandReviewQueue = new Queue("brand-review-queue", { connection });
export const marketIntelligenceQueue = new Queue("market-intelligence-queue", {
  connection,
});
export const distillationQueue = new Queue("distillation-queue", {
  connection,
});

// Custom Full Jitter Backoff Strategy
// delay = base * 2^attempt + random(0, 1000)
/**
 *
 */
const fullJitterBackoff = (attemptsMade: number) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponential = Math.min(baseDelay * Math.pow(2, attemptsMade), maxDelay);
  const jitter = Math.random() * 1000;
  return exponential + jitter;
};

/**
 * Halts queue execution by throwing a specialized error, which acts
 * as a yield to the frontend. The task writes its state to Firestore.
 */
export class ConsentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentRequiredError";
  }
}

export const requestUserConsent = async (
  jobId: string,
  proposedAction: any,
  context: any,
) => {
  const db = admin.firestore();

  await db.collection("Tasks").doc(jobId).set(
    {
      status: "PENDING_CONSENT",
      proposedAction,
      context,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  throw new ConsentRequiredError(
    "Task paused pending user consent in the Action Audit Log.",
  );
};

import Exa from "exa-js";

import { Piscina } from "piscina";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Taxonomy Merge Outbox Worker (Phase 5) ---
let taxonomyPool: Piscina;
if (process.env.NODE_ENV !== "test") {
  taxonomyPool = new Piscina({
    filename: path.resolve(__dirname, "./workers/taxonomyPiscinaWorker.ts"),
    minThreads: 1,
    maxThreads: 4,
    execArgv: ["--import", "tsx"], // needed for running TS files in Piscina thread
  });
}

export const startTaxonomyOutboxWorker = () => {
  // A simple polling worker
  setInterval(async () => {
    try {
      const db = admin.firestore();
      const snap = await db
        .collection("taxonomy_merge_events")
        .where("status", "==", "pending")
        .limit(10)
        .get();

      for (const doc of snap.docs) {
        // Mark as processing
        await doc.ref.update({ status: "processing" });

        // Hand off to piscina pool
        taxonomyPool
          .run({ eventId: doc.id, proposalId: doc.data().proposalId })
          .catch((e) => {
            console.error("Taxonomy pool error:", e);
            doc.ref.update({ status: "failed", error: e.message });
          });
      }
    } catch (e) {
      console.error("Taxonomy outbox poll failed:", e);
    }
  }, 10000); // poll every 10s
};

// --- Continuous Distillation Worker (Phase 5) ---
export const startDistillationWorker = () => {
  const worker = new Worker(
    "distillation-queue",
    async (job) => {
      publishSseEvent(job.id || "unknown", "progress", {
        status: "Starting continuous distillation...",
        progress: 10,
      });

      // 1. Fetch the last_processed_id from some config table or state
      const db = admin.firestore();
      const stateDoc = await db
        .collection("system_state")
        .doc("distillation")
        .get();
      const lastProcessedId = stateDoc.exists
        ? stateDoc.data()?.last_processed_id
        : "00000000-0000-0000-0000-000000000000";

      // 2. Query Postgres (via Supabase) for rows after lastProcessedId
      // For this implementation we mock the query:
      const { supabase } = await import("../utils/hashing");
      const { data, error } = await supabase
        .from("raw_data_versions")
        .select("id, blob_uri, extracted_metadata")
        .gt("id", lastProcessedId)
        .order("id", { ascending: true })
        .limit(100);

      if (error) {
        throw new Error(
          "Failed to fetch records for distillation: " + error.message,
        );
      }

      if (data && data.length > 0) {
        const newWatermark = data[data.length - 1].id;

        // Simulate Distillation (Extracting key insights via Gemini before TTL deletes raw blobs)
        publishSseEvent(job.id || "unknown", "progress", {
          status: `Distilling ${data.length} records...`,
          progress: 50,
        });

        // 3. Update the watermark
        await db.collection("system_state").doc("distillation").set(
          {
            last_processed_id: newWatermark,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return { success: true, recordsProcessed: data.length, newWatermark };
      } else {
        return {
          success: true,
          recordsProcessed: 0,
          newWatermark: lastProcessedId,
        };
      }
    },
    {
      connection,
      settings: {
        backoffStrategy: fullJitterBackoff,
      },
    },
  );

  worker.on("completed", (job) => {
    publishSseEvent(job.id || "unknown", "completed", {
      status: "Distillation Completed",
      result: job.returnvalue,
    });
  });

  worker.on("failed", (job, err) => {
    publishSseEvent(job?.id || "unknown", "failed", { error: err.message });
  });

  return worker;
};
/**
 *
 */
export const startNetworkIoWorker = () => {
  const worker = new Worker(
    "network-io-queue",
    async (job) => {
      if (job.name === "run-validation-campaign") {
        const { runDeepValidationCampaign } = await import("./campaignRoutes");
        await runDeepValidationCampaign(
          job.data.jobId,
          job.data.userId,
          job.data.competitors,
          job.data.baseIdea,
        );
        return { success: true };
      }

      publishSseEvent(job.id || "unknown", "progress", {
        status: "Scraping competitor via Exa...",
        progress: 20,
      });

      const key = process.env.EXA_API_KEY;
      if (!key) throw new Error("EXA_API_KEY is missing");
      const exa = new Exa(key);

      const response = await exa.search(job.data.url, {
        type: "neural",
        numResults: 1,
        contents: {
          text: {
            maxCharacters: 4000,
            includeHtmlTags: false,
          },
        },
      });

      publishSseEvent(job.id || "unknown", "progress", {
        status: "Processing data...",
        progress: 80,
      });

      const resultText =
        response.results && response.results.length > 0
          ? response.results[0].text
          : "";

      return {
        success: true,
        url: job.data.url,
        text: resultText,
      };
    },
    {
      connection,
      settings: {
        backoffStrategy: fullJitterBackoff,
      },
    },
  );

  worker.on("completed", async (job) => {
    publishSseEvent(job.id || "unknown", "completed", {
      status: "Done",
      result: job.returnvalue,
    });

    try {
      if (job.data?.url) {
        const db = admin.firestore();
        const eventId = require("uuid").v4();
        const batch = db.batch();

        batch.set(
          db.collection("telemetry_events").doc(eventId),
          {
            eventId,
            schemaVersion: "v1",
            eventType: "activation",
            actorType: "human",
            projectId: job.data.projectId || "unknown_project",
            payload: {
              competitorCount: 1,
              featuresExtractedCount: 0,
              durationMs:
                job.finishedOn && job.processedOn
                  ? job.finishedOn - job.processedOn
                  : 0,
              jobId: job.id,
              userId: job.data.userId || "unknown",
              environment: process.env.NODE_ENV || "development",
              isTestAccount: false,
            },
            clientTimestamp: Date.now(),
            serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        await batch.commit();
      }
    } catch (e) {
      console.error("Failed to log telemetry for networkIoQueue:", e);
    }
  });

  worker.on("failed", (job, err) => {
    publishSseEvent(job?.id || "unknown", "failed", { error: err.message });
  });

  return worker;
};

import { GoogleGenAI } from "@google/genai";

// --- Vision ML Logic (Gemini 1.5 Pro) ---
/**
 *
 */
export const startVisionMlWorker = () => {
  const worker = new Worker(
    "vision-ml-queue",
    async (job) => {
      publishSseEvent(job.id || "unknown", "progress", {
        status: "Analyzing image via Gemini Vision...",
        progress: 10,
      });

      const { imageBase64, mimeType } = job.data;
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
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "image/png",
            },
          },
        ],
        config: {
          responseMimeType: "application/json",
          systemInstruction:
            'You are a UI analysis expert. Always output valid JSON matching { "features": ["feat1", "feat2"] }.',
        },
      });

      publishSseEvent(job.id || "unknown", "progress", {
        status: "Extracting features...",
        progress: 90,
      });

      const responseText = geminiRes.text || "{}";
      const realResponse =
        typeof responseText === "string"
          ? JSON.parse(responseText)
          : responseText;

      return { success: true, features: realResponse.features || [] };
    },
    {
      connection,
      settings: {
        backoffStrategy: fullJitterBackoff,
      },
    },
  );

  worker.on("completed", (job) => {
    publishSseEvent(job.id || "unknown", "completed", {
      status: "Done",
      result: job.returnvalue,
    });
  });

  worker.on("failed", (job, err) => {
    publishSseEvent(job?.id || "unknown", "failed", { error: err.message });
  });

  return worker;
};
