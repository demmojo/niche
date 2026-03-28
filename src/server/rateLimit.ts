import rateLimit from "express-rate-limit";
import { AuthenticatedRequest } from "./authMiddleware";

// Basic global API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP/User to 300 requests per 15 mins (down from 1000)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Group by User ID if authenticated, else by IP
    return (req as AuthenticatedRequest).user?.uid || req.ip || "unknown-ip";
  },
  message: { error: "Too many requests, please try again later." },
});

// Stricter rate limit for expensive LLM operations
export const llmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP/User to 50 LLM requests per 15 mins (down from 200)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as AuthenticatedRequest).user?.uid || req.ip || "unknown-ip";
  },
  message: {
    error: "Rate limit exceeded for AI generation. Please try again later.",
  },
});

// Stricter rate limit for external API enrichment (Apollo, Exa)
export const enrichmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP/User to 25 enrichment requests per 15 mins (down from 100)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as AuthenticatedRequest).user?.uid || req.ip || "unknown-ip";
  },
  message: {
    error: "Rate limit exceeded for data enrichment. Please try again later.",
  },
});
