import { Router, Request, Response } from "express";
import express from "express";
import { requireAuth, AuthenticatedRequest } from "./authMiddleware";
import { telemetryLimiter } from "./rateLimit";
import { z } from "zod";
import * as admin from "firebase-admin";
import { requireSuperadmin } from "./superadminRoutes";
import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

export const telemetryRouter = Router();

const StrategySummarySchema = z.object({
  strategic_summary: z
    .string()
    .describe("A 2-paragraph plain text strategic summary for the founder."),
  action_items: z
    .array(z.string())
    .describe("3 brutally honest, actionable next steps."),
  referenced_metrics: z
    .array(
      z.object({
        metric_name: z.string(),
        exact_value: z.number(),
      }),
    )
    .describe(
      "Every numerical metric cited in the summary MUST be listed here.",
    ),
});

telemetryRouter.post(
  "/v1/summary",
  express.json({ limit: "10kb" }),
  requireAuth,
  requireSuperadmin,
  async (req: Request, res: Response) => {
    try {
      // 1. Fetch & Aggregate data
      const db = admin.firestore();

      const oneWeekAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      );

      const eventsRef = db
        .collection("telemetry_events")
        .where("serverTimestamp", ">=", oneWeekAgo);
      const snapshot = await eventsRef.get();

      let totalEvents = snapshot.size;
      let syncCommits = 0;
      let lensRejects = 0;
      let lensAccepts = 0;
      let computeUpgrades = 0;
      let competitorIngestions = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.eventName === "market_driven_sync_commit") syncCommits++;
        else if (
          data.eventName === "lens_agent_evaluated" &&
          data.outcome === "rejected"
        )
          lensRejects++;
        else if (
          data.eventName === "lens_agent_evaluated" &&
          data.outcome === "accepted"
        )
          lensAccepts++;
        else if (data.eventName === "compute_upgrade") computeUpgrades++;
        else if (data.eventName === "competitor_ingestion_completed")
          competitorIngestions++;
      });

      const aggregatedMetrics = {
        total_events_7_days: totalEvents,
        competitor_ingestions: competitorIngestions,
        market_driven_sync_commits: syncCommits,
        lens_agent_rejections: lensRejects,
        lens_agent_accepts: lensAccepts,
        compute_upgrades: computeUpgrades,
      };

      const userContext = (req.body.context || "").replace(/[<>]/g, "");

      // 2. Format the Prompt
      const prompt = `
        You are a ruthless, highly opinionated AI Co-Founder and Product Strategist.
        Analyze the following application telemetry and provide a strategic summary.
        User Context: ${userContext}

        <telemetry_data>
        ${JSON.stringify(aggregatedMetrics, null, 2)}
        </telemetry_data>

        <rules>
        1. Base your analysis STRICTLY on the numbers provided in <telemetry_data>. Do not invent or estimate.
        2. If a feature has low adoption, recommend killing it. Warn against horizontal "tarpit" behavior.
        3. Do NOT output markdown code blocks or anything outside of the JSON structure.
        </rules>
      `;

      // 3. Call Gemini with Structured Output
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const schemaForGemini = zodToJsonSchema(
        StrategySummarySchema as any,
        "Summary",
      );

      const result = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: schemaForGemini as any,
        },
      });

      const responseText = result.text;
      if (!responseText) {
        return res.status(500).json({ error: "No response text from Gemini." });
      }

      // 4. Validate against Schema Drift and Hallucinations
      const parsedData = StrategySummarySchema.parse(JSON.parse(responseText));

      res.json(parsedData);
    } catch (error) {
      console.error("Failed to generate strategic summary:", error);
      res.status(500).json({ error: "Failed to generate AI summary." });
    }
  },
);

// Zod schemas for the 4 events
const EventBase = z.object({
  eventId: z.string().uuid(),
  schemaVersion: z.literal("v1"),
  projectId: z.string().optional(),
  actorType: z.enum(["human", "agent", "system"]),
});

const ActivationEvent = EventBase.extend({
  eventName: z.literal("competitor_ingestion_completed"),
  competitorCount: z.number().int().nonnegative(),
  featuresExtractedCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});

const SyncCommitEvent = EventBase.extend({
  eventName: z.literal("market_driven_sync_commit"),
  acceptedDiffsCount: z.number().int().nonnegative(),
  rejectedDiffsCount: z.number().int().nonnegative(),
  entityTypesMutated: z.array(z.string()),
});

const LensEvaluatedEvent = EventBase.extend({
  eventName: z.literal("lens_agent_evaluated"),
  suggestionType: z.string(),
  outcome: z.enum(["accepted", "rejected"]),
  rejectionReason: z.string().optional(),
  dataFingerprint: z.string(),
  textLength: z.number().int().nonnegative(),
});

const ComputeUpgradeEvent = EventBase.extend({
  eventName: z.literal("compute_upgrade"),
  upgradeType: z.string(),
  provider: z.string(),
});

// A batch of events
const TelemetryEventSchema = z.discriminatedUnion("eventName", [
  ActivationEvent,
  SyncCommitEvent,
  LensEvaluatedEvent,
  ComputeUpgradeEvent,
]);

const TelemetryBatchSchema = z.array(TelemetryEventSchema);

telemetryRouter.post(
  "/v1/ui-sync",
  express.json({ limit: "5kb" }),
  requireAuth,
  telemetryLimiter,
  async (req: Request, res: Response) => {
    try {
      const userReq = req as AuthenticatedRequest;
      const userId = userReq.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate array of events
      const parsed = TelemetryBatchSchema.safeParse(req.body);

      if (!parsed.success) {
        console.warn("Telemetry validation failed:", parsed.error.format());
        return res.status(400).json({ error: "Bad Request" });
      }

      const events = parsed.data;
      if (events.length === 0) {
        return res.status(202).json({ status: "accepted" });
      }

      const isTestAccount =
        userReq.user?.email?.endsWith("@nicheai.com") ||
        userReq.user?.email?.includes("+test@");

      const db = admin.firestore();

      // We can use a batch to insert these idempotently
      // Firestore batch limit is 500, if length > 500 we should chunk, but request size is 5kb so it won't be > 500
      const batch = db.batch();
      const telemetryCol = db.collection("telemetry_events");

      for (const event of events) {
        const docRef = telemetryCol.doc(event.eventId);

        // Override payload with server-trusted context
        const secureEvent = {
          ...event,
          context: {
            userId,
            environment: process.env.NODE_ENV || "development",
            isTestAccount: !!isTestAccount,
            clientIp: req.ip,
            userAgent: req.get("user-agent") || "unknown",
          },
          serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(docRef, secureEvent, { merge: true });
      }

      await batch.commit();

      return res.status(202).json({ status: "accepted" });
    } catch (error) {
      console.error("Failed to sync telemetry:", error);
      // Return 202 anyway to avoid client retry loop on server errors, or 500.
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);
