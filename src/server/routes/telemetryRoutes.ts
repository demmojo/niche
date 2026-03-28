import { Router } from "express";
import rateLimit from "express-rate-limit";
import express from "express";
import { TelemetryEventSchema } from "../../types/telemetry";
import * as admin from "firebase-admin";
import { requireAuth } from "../authMiddleware";
import { requireSuperadmin } from "../superadminRoutes";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const telemetryRouter = Router();

const telemetryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window`
  message: "Too many telemetry requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

telemetryRouter.use(express.json({ limit: "5kb" }));

telemetryRouter.post("/v1/ui-sync", telemetryLimiter, async (req, res) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Events array is required" });
    }

    const db = admin.firestore();
    const batch = db.batch();
    const serverTimestamp = Date.now();

    const userId = (req as any).user?.uid || null;

    for (const rawEvent of events) {
      const parsedEvent = TelemetryEventSchema.safeParse(rawEvent);
      if (!parsedEvent.success) {
        console.warn("Invalid telemetry event dropped:", parsedEvent.error);
        continue;
      }

      const event = parsedEvent.data;
      const eventRef = db.collection("telemetry_events").doc(event.eventId);

      batch.set(eventRef, {
        ...event,
        serverTimestamp,
        ...(userId && { userId }),
      });
    }

    await batch.commit();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telemetry ui-sync error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

telemetryRouter.post(
  "/v1/summary",
  requireAuth,
  requireSuperadmin,
  async (req, res) => {
    try {
      const db = admin.firestore();

      // 1. Aggregate: Fetch recent telemetry events
      const snapshot = await db
        .collection("telemetry_events")
        .orderBy("serverTimestamp", "desc")
        .limit(1000)
        .get();

      const events = snapshot.docs.map((doc) => doc.data());

      // Calculate simple metrics for the prompt
      const metrics = {
        total_events: events.length,
        activation_events: events.filter((e) => e.eventType === "activation")
          .length,
        core_action_events: events.filter((e) => e.eventType === "core_action")
          .length,
        retention_proxy_events: events.filter(
          (e) => e.eventType === "retention_proxy",
        ).length,
        revenue_signal_events: events.filter(
          (e) => e.eventType === "revenue_signal",
        ).length,
      };

      const telemetryDataXml = `
<telemetry_data>
  <metrics>
    <metric name="Total Events" exact_value="${metrics.total_events}" />
    <metric name="Activation Events" exact_value="${metrics.activation_events}" />
    <metric name="Core Action Events" exact_value="${metrics.core_action_events}" />
    <metric name="Retention Proxy Events" exact_value="${metrics.retention_proxy_events}" />
    <metric name="Revenue Signal Events" exact_value="${metrics.revenue_signal_events}" />
  </metrics>
</telemetry_data>
`;

      // 3. Generate & Validate with Gemini 3.1 Pro + Zod
      const StrategicSummarySchema = z.object({
        strategic_summary: z.string(),
        action_items: z.array(z.string()),
        referenced_metrics: z.array(
          z.object({
            metric_name: z.string(),
            exact_value: z.number(),
          }),
        ),
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `You are a strict Product Data Analyst AI. 
Analyze the following telemetry data and provide a strategic summary.
Focus on identifying feature bloat indicators and the health of the 4 core metrics (Activation, Core Action, Retention Proxy, Revenue Signal).
Do not hallucinate metrics. All referenced_metrics MUST exactly match the values provided in the telemetry_data XML.

${telemetryDataXml}`;

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.1-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(
            StrategicSummarySchema as any,
            "StrategicSummarySchema",
          ) as any,
          systemInstruction:
            "You are a data-driven product analyst. Output strict JSON matching the requested schema.",
        },
      });

      const parsedResponse = JSON.parse(geminiRes.text || "{}");
      const validatedSummary = StrategicSummarySchema.parse(parsedResponse);

      res.status(200).json(validatedSummary);
    } catch (error) {
      console.error("Telemetry summary generation error:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  },
);
