import { Router, Request, Response } from "express";
import express from "express";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";
import { atomicRateLimitCheck } from "../utils/rateLimitCounters";

export const roastRoutes = Router();

// Define Cloud Task Client. Mock or instantiate properly.
const tasksClient = new CloudTasksClient();

// Apply the 100kb payload limit for this specific route/router as per ML-engineering-standards
roastRoutes.use(
  express.json({
    limit: "100kb",
    type: ["application/json", "application/csp-report"],
  }),
);

roastRoutes.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    // If express.json() didn't parse the body (e.g. invalid content type), req.body might be undefined or empty
    if (!req.is(["application/json", "application/csp-report"])) {
      res.status(415).json({ error: "Unsupported Media Type" });
      return;
    }

    const { idea, owner_uid } = req.body || {};
    const uid = owner_uid || "anonymous";
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";

    const isAllowed = await atomicRateLimitCheck(uid, 5, ipAddress); // Example limit 5
    if (!isAllowed) {
      if (uid === "anonymous") {
        // Return 402 for logical quota exhaustion on unauthenticated users to trigger auth/upgrade modal
        res.status(402).json({ error: "QUOTA_EXCEEDED" });
      } else {
        // 429 for WAF or physical throttling
        res.status(429).json({ error: "Rate limit exceeded" });
      }
      return;
    }

    const db = admin.firestore();
    const jobRef = db.collection("jobs").doc();

    // Await initial creation synchronously before returning 202 to prevent Phantom 202 Responses
    try {
      await jobRef.set({
        idea,
        owner_uid: uid,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.FieldValue.serverTimestamp(), // TODO: Replace with proper +24h or +30d Timestamp logic based on uid
      });
    } catch (setErr) {
      console.error("Failed to create initial job ledger:", setErr);
      res.status(500).json({ error: "Failed to initialize job" });
      return;
    }

    // Create a Cloud Task payload (Claim Check pattern)
    // Send minimal payload as required (100kb max per Cloud Task)
    const project = process.env.GOOGLE_CLOUD_PROJECT || "nicheai-dev";
    const location = process.env.CLOUD_TASK_LOCATION || "us-central1";
    const queue = process.env.CLOUD_TASK_QUEUE || "roast-worker-queue";
    const url =
      process.env.WORKER_URL ||
      `https://${project}.run.app/api/internal/worker/roast`;

    const parent = tasksClient.queuePath(project, location, queue);
    const task = {
      httpRequest: {
        httpMethod: "POST" as const,
        url,
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(
          JSON.stringify({ jobId: jobRef.id, isHeavyPayload: true }),
        ).toString("base64"),
      },
    };

    // Detach the Cloud Task dispatch as a floating promise.
    tasksClient.createTask({ parent, task }).catch((error) => {
      console.error("Background task dispatch failed:", error);
      jobRef
        .update({ status: "failed", error: "Failed to dispatch task" })
        .catch(console.error);
    });

    // Return 202 Accepted immediately
    res.status(202).json({
      jobId: jobRef.id,
      claimCheckPath: `/jobs/${jobRef.id}`,
      status: "accepted",
      message: "searching_exa",
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
