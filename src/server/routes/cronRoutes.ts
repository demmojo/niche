import { Router, Request, Response } from "express";
import { requireInternalOidc } from "../internalAuthMiddleware";
import * as admin from "firebase-admin";

import { runTarpitClustering } from "../../services/tarpitFlywheel";

export const cronRouter = Router();

cronRouter.use(requireInternalOidc);

// Tarpit Clustering Cron Route (Replacing Hourly setInterval)
cronRouter.post("/tarpit-clustering", async (req: Request, res: Response) => {
  try {
    await runTarpitClustering();
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Tarpit clustering failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Taxonomy Merge Outbox Cron Route (Replacing 10s setInterval)
// Cloud Scheduler triggers this instead of polling loop
import { processTaxonomyOutboxJobs } from "../workers/taxonomyPiscinaWorker";

cronRouter.post("/taxonomy-merge", async (req: Request, res: Response) => {
  try {
    await processTaxonomyOutboxJobs();
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Taxonomy merge cron failed:", error);
    return res.status(500).json({ error: error.message });
  }
});
