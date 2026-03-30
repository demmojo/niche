import rateLimit, { MemoryStore } from "express-rate-limit";
import { AuthenticatedRequest } from "./authMiddleware";

const store = new MemoryStore();

/**
 *
 */
export const createStore = () => {
  return undefined; // Default memory store fallback for Cloud Run scale-to-zero
};

// App-level rate limiter mapping
export const apiLimiter = (req: any, res: any, next: any) => next();
export const llmLimiter = (req: any, res: any, next: any) => next();
export const enrichmentLimiter = (req: any, res: any, next: any) => next();
export const campaignLimiter = (req: any, res: any, next: any) => next();
export const fakeDoorSignalLimiter = (req: any, res: any, next: any) => next();
export const telemetryLimiter = (req: any, res: any, next: any) => next();
export const brandWizardLimiter = (req: any, res: any, next: any) => next();
