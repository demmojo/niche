import { logger } from "../logger";
import { Router, Request, Response } from "express";
import { requireInternalOidc } from "../internalAuthMiddleware";
import admin from "firebase-admin";

import { runTarpitClustering } from "../../services/tarpitFlywheel";

export const cronRouter = Router();

cronRouter.use(requireInternalOidc);

// Tarpit Clustering Cron Route (Replacing Hourly setInterval)
cronRouter.post("/tarpit-clustering", async (req: Request, res: Response) => {
  try {
    await runTarpitClustering();
    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error("Tarpit clustering failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Taxonomy Merge Outbox Cron Route (Replacing 10s setInterval)
// Cloud Scheduler triggers this instead of polling loop
import { processTaxonomyOutboxJobs } from "../workers/taxonomyPiscinaWorker";
import { processDataQualitySync } from "../workers/dataQualitySyncWorker";

cronRouter.post("/taxonomy-merge", async (req: Request, res: Response) => {
  try {
    await processTaxonomyOutboxJobs();
    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error("Taxonomy merge cron failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Data Quality Dashboard Sync
// Triggered daily via Cloud Scheduler to pre-aggregate BQ metrics
cronRouter.post("/data-quality-sync", async (req: Request, res: Response) => {
  try {
    const payload = await processDataQualitySync();
    return res.status(200).json({ success: true, data: payload });
  } catch (error: any) {
    logger.error("Data quality sync failed:", error);
    return res.status(500).json({ error: error.message });
  }
});
