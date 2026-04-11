import { Router, Request, Response } from "express";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "redis";

// Global singleton Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));

export const workerRouter = Router();

// Ensure Redis is connected before handling requests
workerRouter.use(async (req, res, next) => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error("Failed to connect to Redis", err);
    }
  }
  next();
});

workerRouter.post(
  "/roast",
  async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.body;
    if (!jobId) {
      res.status(400).json({ error: "Missing jobId" });
      return;
    }

    const db = admin.firestore();
    const jobRef = db.collection("jobs").doc(jobId);

    try {
      const shouldProcess = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(jobRef);
        if (!doc.exists) {
          return false;
        }

        const data = doc.data();
        if (data?.status === "completed" || data?.status === "failed") {
          // Job is already done or failed. Idempotent return.
          return false;
        }

        if (data?.status === "processing" && data?.leased_until) {
          // Check if lease expired
          const now = admin.firestore.Timestamp.now().toMillis();
          const leasedUntil = data.leased_until.toMillis
            ? data.leased_until.toMillis()
            : data.leased_until;
          if (now < leasedUntil) {
            // Lease is still valid, let another worker handle it or ignore
            return false;
          }
        }

        // Claim the job
        const leaseDurationMs = 5 * 60 * 1000; // 5 mins
        const leased_until = admin.firestore.Timestamp.fromMillis(
          Date.now() + leaseDurationMs,
        );

        // In tests, mockTransactionUpdate is called with string "doc-ref",
        // but in real runTransaction, it expects a DocumentReference.
        // The test says: expect(mockTransactionUpdate).toHaveBeenCalledWith("doc-ref", ...)
        // Wait, let's look at how the test mocks it:
        // mockTransactionGet.mockResolvedValue({ exists: true, data: () => ... });
        // The test expects: expect(mockTransactionUpdate).toHaveBeenCalledWith("doc-ref", expect.objectContaining({...}))
        // Wait! If the test specifically expects "doc-ref", we might fail if we pass `jobRef`.
        // Let's check the test again.
        // Ah, the test does: expect(mockTransactionUpdate).toHaveBeenCalledWith("doc-ref", expect.objectContaining({ status: "processing" }))
        // No wait, if I pass jobRef, the test will check if jobRef is "doc-ref" and it might fail.
        // I'll just pass jobRef and if the test fails I'll fix the test, as it's my job to implement it properly.

        transaction.update(jobRef, {
          status: "processing",
          leased_until,
        });

        return true;
      });

      if (!shouldProcess) {
        // Return 200 OK to acknowledge and prevent Cloud Tasks from retrying
        res.status(200).json({ status: "skipped or completed" });
        return;
      }

      // Now execute LLM
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "mock-key",
      });
      const stream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro",
        contents: [{ role: "user", parts: [{ text: "Roast this idea" }] }],
      });

      // Stream to Redis
      const channel = `job:${jobId}`;
      let fullText = "";
      let lastFlushTime = Date.now();
      const FLUSH_INTERVAL_MS = 4000; // 4 seconds

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          if (redisClient.isOpen) {
            await redisClient.publish(
              channel,
              JSON.stringify({ chunk: chunkText }),
            );
          }

          // Periodically flush to Firestore every 3-5s
          if (Date.now() - lastFlushTime > FLUSH_INTERVAL_MS) {
            await jobRef.update({ fullText });
            lastFlushTime = Date.now();
          }
        }
      }

      // Mark as completed in Firestore
      await jobRef.update({
        status: "completed",
        fullText,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ status: "completed" });
    } catch (error) {
      console.error("Worker error:", error);
      // Return 500 to signal Cloud Tasks to retry the background job
      res.status(500).json({ error: "Worker failed" });
    }
  },
);
