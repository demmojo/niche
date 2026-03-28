import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  trackRequest,
  updateRateLimits,
  getUsageStats,
  getKeyUsage,
  getResetTime,
} from "../../utils/usageTracker";

describe("usageTracker utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getUsageStats", () => {
    it("should return empty stats structure initially", () => {
      const stats = getUsageStats();
      expect(stats.date).toBe("2023-01-01");
      expect(stats.services.gemini.requests).toBe(0);
      expect(stats.services.apollo.requests).toBe(0);
      expect(stats.services.exa.requests).toBe(0);
      expect(stats.services.openai.requests).toBe(0);
      expect(stats.services.anthropic.requests).toBe(0);
    });
  });

  describe("trackRequest", () => {
    it("should track successful requests for gemini", () => {
      trackRequest("gemini", "my-key", false, "gemini-3.1-pro-preview");

      const stats = getUsageStats();
      expect(stats.services.gemini.requests).toBe(1);
      expect(
        stats.services.gemini.requestsPerModel?.["gemini-3.1-pro-preview"],
      ).toBe(1);
      expect(stats.services.gemini.estimatedInputTokens).toBeGreaterThan(0);
      expect(stats.services.gemini.estimatedOutputTokens).toBeGreaterThan(0);

      const keyUsage = getKeyUsage();
      expect(keyUsage["my-key"].requestsToday).toBe(1);
      expect(keyUsage["my-key"].totalRequests).toBe(1);
      expect(keyUsage["my-key"].errors).toBe(0);
    });

    it("should track error requests", () => {
      trackRequest("apollo", "my-apollo-key", true);

      const stats = getUsageStats();
      expect(stats.services.apollo.requests).toBe(0); // Only counts successes

      const keyUsage = getKeyUsage();
      expect(keyUsage["my-apollo-key"].requestsToday).toBe(0);
      expect(keyUsage["my-apollo-key"].errors).toBe(1);
    });

    it("should reset key requestsToday on a new day", () => {
      trackRequest("exa", "exa-key", false);
      let keyUsage = getKeyUsage();
      expect(keyUsage["exa-key"].requestsToday).toBe(1);

      // Move to next day
      vi.setSystemTime(new Date("2023-01-02T12:00:00Z"));
      trackRequest("exa", "exa-key", false);

      keyUsage = getKeyUsage();
      expect(keyUsage["exa-key"].requestsToday).toBe(1);
      expect(keyUsage["exa-key"].totalRequests).toBe(2);
    });
  });

  describe("updateRateLimits", () => {
    it("should update rate limits for a service", () => {
      updateRateLimits("apollo", 100, 42, 3600);

      const stats = getUsageStats();
      expect(stats.services.apollo.rateLimit?.limit).toBe(100);
      expect(stats.services.apollo.rateLimit?.remaining).toBe(42);

      // The resetDate should be set
      expect(stats.services.apollo.rateLimit?.resetDate).not.toBeNull();
    });

    it("should not overwrite limits with null if they already exist", () => {
      updateRateLimits("exa", 500, 100, 3600);
      updateRateLimits("exa", null, 99, null);

      const stats = getUsageStats();
      expect(stats.services.exa.rateLimit?.limit).toBe(500); // kept old value
      expect(stats.services.exa.rateLimit?.remaining).toBe(99); // updated
    });
  });

  describe("getResetTime", () => {
    it("returns a future date for the reset time", () => {
      const resetTime = getResetTime();
      expect(resetTime).toBeInstanceOf(Date);
      expect(resetTime.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
    });
  });
});
