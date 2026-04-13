import { Request, Response, NextFunction } from "express";
import { createClient } from "redis";
import { logger } from "./logger";

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));

// Lazy connect
const ensureRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (e) {
      // Intentionally swallow here to let the limiter catch it
    }
  }
};

const createRedisLimiter = (limit: number, windowMs: number) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      await ensureRedis();
      if (!redisClient.isOpen) {
        throw new Error("Redis connection unavailable");
      }

      // Rate limit per user if authenticated, else IP
      const key = req.user?.uid ? `rl:${req.user.uid}` : `rl:${req.ip}`;

      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, Math.floor(windowMs / 1000));
      }

      if (current > limit) {
        return res.status(429).json({ error: "Too Many Requests" });
      }

      next();
    } catch (error: any) {
      logger.error("Rate Limiter Error:", error);
      // FAIL CLOSED: If Redis is unreachable, fail the request (fail-closed circuit breaker)
      return res
        .status(503)
        .json({ error: "Service Unavailable: Rate limit check failed." });
    }
  };
};

export const apiLimiter = createRedisLimiter(100, 60000); // 100 per minute
export const llmLimiter = createRedisLimiter(30, 60000); // 30 per minute
export const enrichmentLimiter = createRedisLimiter(50, 60000);
export const campaignLimiter = createRedisLimiter(20, 60000);
export const fakeDoorSignalLimiter = createRedisLimiter(200, 60000);
export const telemetryLimiter = createRedisLimiter(500, 60000);
export const brandWizardLimiter = createRedisLimiter(30, 60000);
