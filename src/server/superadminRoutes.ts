import { logger } from "./logger";
import { Router } from "express";
import { normalizeEmail } from "../utils/email";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "./authMiddleware";
import * as admin from "firebase-admin";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { DataGatherer } from "./agents/DataGatherer";
import { ReportSynthesizer } from "./agents/ReportSynthesizer";

export const requireSuperadmin = async (req: any, res: any, next: any) => {
  if (req.user?.isSuperadmin === true) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Superadmin only" });
};

export const superadminRouter = Router();

superadminRouter.post(
  "/submit-lead",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const { idea, email } = req.body;
      if (!idea || !email) {
        return res.status(400).json({ error: "Idea and email are required" });
      }

      const db = admin.firestore();
      const normalizedInputEmail = normalizeEmail(email);
      const authNormalizedEmail = req.user?.email
        ? normalizeEmail(req.user.email)
        : null;
      const isEmailVerified = !!(
        req.user &&
        !req.user.isAnonymous &&
        authNormalizedEmail === normalizedInputEmail &&
        req.user.email_verified
      );
      const creatorUid = req.user?.uid || null;

      await db.collection("leads").add({
        email,
        normalizedEmail: normalizedInputEmail,
        idea,
        creatorUid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      (async () => {
        try {
          const gatherer = new DataGatherer();
          const synthesizer = new ReportSynthesizer();
          const context = await gatherer.gather(idea);
          const report = await synthesizer.synthesize(idea, context);

          await db.collection("pending_reports").add({
            draft_markdown: report.draftMarkdown,
            lineage_data: {
              exaResults: context.exaResults,
              apolloKeywords: context.apolloKeywords,
              tarpitScore: report.tarpitScore,
              wasOverridden: report.wasOverridden,
            },
            userEmail: email,
            normalizedEmail: normalizedInputEmail,
            creatorUid,
            isEmailVerified,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (pipelineErr) {
          logger.error("Superadmin 2-Agent Pipeline Error:", pipelineErr);
        }
      })();

      return res.status(202).json({ success: true, message: "Lead submitted" });
    } catch (e: any) {
      logger.error("Submit Lead error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export async function surfaceRoastHandler(req: any, res: any) {
  try {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: "Idea is required" });

    const key = req.llmApiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key available.");
    const ai = new GoogleGenAI({ apiKey: key });

    const SurfaceRoastSchema = z.object({
      bullets: z.array(z.string()).min(3).max(3),
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash",
      contents: `Provide a brutal 3-bullet point "Surface Roast" of this product idea indicating why it might fail or be a tarpit: ${idea.replace(/[<>]/g, "")}`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(SurfaceRoastSchema as any) as any,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    logger.error("Surface Roast Error:", error);
    return res.status(500).json({ error: "Failed to generate roast." });
  }
}
