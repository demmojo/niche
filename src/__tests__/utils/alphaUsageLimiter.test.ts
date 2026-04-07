// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkAlphaLimit,
  recordAlphaUsage,
} from "../../utils/alphaUsageLimiter";

describe("alphaUsageLimiter", () => {
  const ALPHA_LIMIT_KEY = "nicheai_alpha_usage";

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checkAlphaLimit returns true when no limit data exists", () => {
    expect(checkAlphaLimit()).toBe(true);
  });

  it("recordAlphaUsage creates entry with count 1", () => {
    const today = new Date().toISOString().split("T")[0];
    recordAlphaUsage();

    const data = JSON.parse(localStorage.getItem(ALPHA_LIMIT_KEY) || "{}");
    expect(data.date).toBe(today);
    expect(data.count).toBe(1);
  });

  it("recordAlphaUsage increments count for the same day", () => {
    recordAlphaUsage();
    recordAlphaUsage();

    const data = JSON.parse(localStorage.getItem(ALPHA_LIMIT_KEY) || "{}");
    expect(data.count).toBe(2);
  });

  it("checkAlphaLimit returns false when limit is reached", () => {
    recordAlphaUsage();
    expect(checkAlphaLimit()).toBe(false);
  });

  it("recordAlphaUsage resets count on a new day", () => {
    const today = new Date("2026-03-18T10:00:00Z");
    vi.setSystemTime(today);
    recordAlphaUsage();

    expect(checkAlphaLimit()).toBe(false);

    const tomorrow = new Date("2026-03-19T10:00:00Z");
    vi.setSystemTime(tomorrow);

    expect(checkAlphaLimit()).toBe(true);
    recordAlphaUsage();

    const data = JSON.parse(localStorage.getItem(ALPHA_LIMIT_KEY) || "{}");
    expect(data.date).toBe("2026-03-19");
    expect(data.count).toBe(1);
  });
});
