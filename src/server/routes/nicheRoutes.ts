import { logger } from "../logger";
import { Router, Response } from "express";
import {
  AuthenticatedRequest,
  requireAuth,
  requireAppCheck,
} from "../authMiddleware";
import { z } from "zod";
import Exa from "exa-js";
import { GoogleGenAI, Type } from "@google/genai";
import admin from "firebase-admin";
import { enqueueTask } from "../cloudTasks";

export const nicheRouter = Router();

// Zod validation for input
const ValidateJitSchema = z
  .object({
    idea: z.string().min(3).max(500),
  })
  .strict();

// Schema for Gemini Structured Output
const JITExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    idea: {
      type: Type.STRING,
      description: "The original idea validated",
    },
    competitors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          core_features: { type: Type.ARRAY, items: { type: Type.STRING } },
          target_audience: { type: Type.ARRAY, items: { type: Type.STRING } },
          is_hyper_velocity_tarpit: { type: Type.BOOLEAN },
          engineering_to_sales_ratio: { type: Type.NUMBER },
          integration_count: { type: Type.NUMBER },
          indexation_size: { type: Type.NUMBER },
          sponsored_presence: { type: Type.BOOLEAN },
        },
        required: ["domain", "is_hyper_velocity_tarpit"],
      },
    },
  },
  required: ["idea", "competitors"],
};

nicheRouter.post(
  "/validate-jit",
  requireAuth,
  requireAppCheck,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = ValidateJitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid payload", details: parsed.error.issues });
      }

      // Prompt injection sanitization: strip angle brackets
      const sanitizedIdea = parsed.data.idea.replace(/[<>]/g, "");

      // Phase 2: Cache-Hit check
      const cacheRef = await admin
        .firestore()
        .collection("founder_demand_queries")
        .where("idea", "==", sanitizedIdea)
        .limit(1)
        .get();

      if (!cacheRef.empty) {
        const cachedDoc = cacheRef.docs[0].data();
        if (cachedDoc.cached_result) {
          // Sub-second response
          return res.status(200).json(cachedDoc.cached_result);
        }
      }

      // Phase 2: Setup SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const abortController = new AbortController();
      req.on("close", () => {
        abortController.abort();
      });

      const writeEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        writeEvent("status", { message: "Searching market..." });

        const exa = new Exa(process.env.EXA_API_KEY!);
        const exaQuery = `${sanitizedIdea} startups shutting down OR pivot OR post-mortem OR alternatives`;

        const exaResult = await exa.searchAndContents(exaQuery, {
          numResults: 10,
          useAutoprompt: true,
          text: true,
        });

        if (abortController.signal.aborted) return;

        writeEvent("status", { message: "Analyzing competitors..." });

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const prompt = `Analyze these search results for the idea: "${sanitizedIdea}". Extract competitor data.
        
        Search Results:
        ${exaResult.results.map((r: any) => `URL: ${r.url}\nText: ${r.text}`).join("\n\n")}
        `;

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: JITExtractionSchema,
          },
        });

        let fullJson = "";
        for await (const chunk of responseStream) {
          if (abortController.signal.aborted) return;
          if (chunk.text) {
            fullJson += chunk.text;
            writeEvent("chunk", { text: chunk.text });
          }
        }

        // Parse the final JSON
        const parsedResult = JSON.parse(fullJson);
        writeEvent("complete", parsedResult);

        // Phase 3: Processing, Claim Check & Cloud Task
        const payloadDocRef = admin
          .firestore()
          .collection("cloud_tasks_payloads")
          .doc();
        await payloadDocRef.set({
          idea: sanitizedIdea,
          competitors: parsedResult.competitors,
          userId: req.user?.uid || "anonymous",
          timestamp: new Date().toISOString(),
          // Note: A 24h TTL should be set on this collection via Google Cloud Console
        });

        await enqueueTask(
          "flywheel-queue",
          "/api/internal/worker/flywheel-cache-jit",
          { payloadDocId: payloadDocRef.id },
        );
      } catch (err: any) {
        if (err.name === "AbortError") {
          logger.info("Client aborted connection during /validate-jit");
        } else {
          logger.error("Error in /validate-jit stream:", err);
          writeEvent("error", {
            message: "Internal Server Error",
            details: err.message,
          });
        }
      } finally {
        res.end();
      }
    } catch (error) {
      logger.error("Unhandled error in /validate-jit route:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);
