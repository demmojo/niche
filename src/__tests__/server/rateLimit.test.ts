import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("rateLimit", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should return undefined if process.env.REDIS_URL is not set", async () => {
    delete process.env.REDIS_URL;
    const { createStore } = await import("../../server/rateLimit");
    expect(createStore()).toBeUndefined();
  });

  it("should return undefined if process.env.REDIS_URL is set", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    const { createStore } = await import("../../server/rateLimit");
    const store = createStore();
    expect(store).toBeUndefined();
  });

  it("should have pass-through middleware functions", async () => {
    const {
      apiLimiter,
      llmLimiter,
      enrichmentLimiter,
      campaignLimiter,
      fakeDoorSignalLimiter,
      telemetryLimiter,
      brandWizardLimiter,
    } = await import("../../server/rateLimit");

    const nextMock = vi.fn();
    apiLimiter({}, {}, nextMock);
    llmLimiter({}, {}, nextMock);
    enrichmentLimiter({}, {}, nextMock);
    campaignLimiter({}, {}, nextMock);
    fakeDoorSignalLimiter({}, {}, nextMock);
    telemetryLimiter({}, {}, nextMock);
    brandWizardLimiter({}, {}, nextMock);
    expect(nextMock).toHaveBeenCalledTimes(7);
  });
});
