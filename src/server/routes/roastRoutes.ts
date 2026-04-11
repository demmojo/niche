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

    const isAllowed = await atomicRateLimitCheck(uid, 5); // Example limit 5
    if (!isAllowed) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }

    const db = admin.firestore();
    const jobRef = db.collection("jobs").doc();

    // Set initial state in Firestore to pending
    const setPromise = jobRef.set({
      idea,
      owner_uid: uid,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
    // It waits for the Firestore write to complete first to prevent worker race conditions.
    setPromise
      .then(() => {
        return tasksClient.createTask({ parent, task });
      })
      .catch((error) => {
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
