import { Router, Request, Response } from "express";
import express from "express";
import * as admin from "firebase-admin";
import { checkRateLimit, incrementRateLimitCounter } from "../utils/rateLimitCounters";

export const roastRoutes = Router();

// Apply the 100kb payload limit for this specific route/router as per ML-engineering-standards
roastRoutes.use(express.json({ limit: "100kb" }));

roastRoutes.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, owner_uid } = req.body;
    const uid = owner_uid || "anonymous";

    const isAllowed = await checkRateLimit(uid, 5); // Example limit 5
    if (!isAllowed) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }

    await incrementRateLimitCounter(uid);

    const db = admin.firestore();
    const jobRef = db.collection("jobs").doc();
    
    await jobRef.set({
      idea,
      owner_uid: uid,
      status: "accepted",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(202).json({
      jobId: jobRef.id,
      status: "accepted",
      message: "searching_exa"
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
