import rateLimit from "express-rate-limit";
import { AuthenticatedRequest } from "./authMiddleware";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

// Use environment variable for Redis connection
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

/**
 *
 */
const createStore = () => {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args: string[]) => {
        const [command, ...rest] = args;
        return redisClient.call(command, ...rest) as any;
      },
    });
  }
  return undefined; // Default memory store fallback
};

// App-level rate limiter mapping
export const apiLimiter = (req: any, res: any, next: any) => next();
export const llmLimiter = (req: any, res: any, next: any) => next();
export const enrichmentLimiter = (req: any, res: any, next: any) => next();
export const campaignLimiter = (req: any, res: any, next: any) => next();
export const fakeDoorSignalLimiter = (req: any, res: any, next: any) => next();
export const telemetryLimiter = (req: any, res: any, next: any) => next();
export const brandWizardLimiter = (req: any, res: any, next: any) => next();
