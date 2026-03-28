import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "./authMiddleware";
import * as admin from "firebase-admin";
import { brandWizardLimiter } from "./rateLimit";
import { brandWizardQueue } from "./queues";
import { z } from "zod";

export const brandWizardRouter = Router();

// Strict SSRF Validation Schema for URLs
const urlSchema = z.string().url().refine((val) => {
  try {
    const url = new URL(val);
    const hostname = url.hostname;
    
    // Block non-HTTP/HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    
    // Block localhost and private IPs (basic SSRF defense)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
    if (hostname.startsWith('10.')) return false;
    if (hostname.startsWith('192.168.')) return false;
    if (hostname.startsWith('169.254.')) return false;
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false;

    return true;
  } catch {
    return false;
  }
}, { message: "Invalid or blocked URL" });

const createJobSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  urls: z.array(urlSchema).min(1, "At least 1 URL is required").max(5, "Maximum of 5 URLs allowed"),
});

brandWizardRouter.post(
  "/start",
  requireAuth,
  brandWizardLimiter,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.uid;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const parseResult = createJobSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid payload", 
          details: parseResult.error.issues 
        });
      }

      const { projectId, urls } = parseResult.data;
      const db = admin.firestore();

      // Insert job into Firestore
      const jobRef = db.collection("brand_wizard_jobs").doc();
      const jobId = jobRef.id;

      await jobRef.set({
        projectId,
        userId,
        status: "pending",
        progress: { totalUrls: urls.length, completed: 0, failed: 0 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Dispatch to BullMQ for asynchronous processing
      await brandWizardQueue.add("extract-brand", {
        jobId,
        projectId,
        userId,
        urls,
      });

      // Return 202 Accepted immediately
      return res.status(202).json({ 
        jobId, 
        message: "Brand Identity extraction job started." 
      });

    } catch (error: any) {
      console.error("Brand Wizard start error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
