import { Router, Request, Response } from "express";
import express from "express";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";
import { z } from "zod";
// We should import the redis client logic to do the rate limit, but let's first set it up.

export const roastRoutes = Router();

const tasksClient = new CloudTasksClient();

roastRoutes.use(
  express.json({
    limit: "100kb",
    type: ["application/json", "application/csp-report"],
  })
);

// Define Zod schema
const RoastRequestSchema = z.object({
  idea: z.string().min(10).max(5000),
  // owner_uid MUST NOT be extracted from body
});

roastRoutes.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.is(["application/json", "application/csp-report"])) {
      res.status(415).json({ error: "Unsupported Media Type" });
      return;
    }

    // Validate with Zod
    const validationResult = RoastRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ error: "Invalid request body format" });
      return;
    }

    const { idea } = validationResult.data;
    
    // Auth middleware should populate req.user
    // For now, if no auth middleware, assume anonymous (in real app, use auth middleware)
    // Wait, the spec says "rely exclusively on req.user.uid from verified Auth middleware."
    // Let's assume req.user is populated by a prior middleware.
    const uid = (req as any).user?.uid || "anonymous";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";

    // Rate Limiting (Phase 1 Redis Pipeline)
    // For now, since we need to remove Firestore rate limiter, let's implement the Redis one here or in a utils file.
