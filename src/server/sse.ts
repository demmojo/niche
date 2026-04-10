import { logger } from "./logger";
import { Request, Response } from "express";
import admin from "firebase-admin";

/**
 * Publishes SSE events by writing them to Firestore.
 * Clients will use onSnapshot to listen for updates instead of true SSE connections.
 */
export const publishSseEvent = async (
  jobId: string,
  eventName: string,
  payload: any,
) => {
  try {
    const db = admin.firestore();
    await db.collection("sse_events").add({
      jobId,
      eventName,
      data: payload,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("Failed to publish SSE event to Firestore", error);
  }
};

/**
 * Deprecated HTTP SSE Endpoint.
 * In a scale-to-zero serverless architecture, long-lived SSE connections are an anti-pattern.
 * Clients must migrate to Firestore onSnapshot listeners.
 */
export const sseEndpoint = async (req: Request, res: Response) => {
  res.status(410).json({
    error: "SSE is deprecated in Serverless mode. Use Firestore onSnapshot.",
  });
};
