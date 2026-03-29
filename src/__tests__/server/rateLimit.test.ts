import { describe, it, expect, vi, beforeEach } from "vitest";

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

  it("should return a RedisStore if process.env.REDIS_URL is set", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    // Mock ioredis
    vi.mock("ioredis", () => {
      return {
        default: vi.fn().mockImplementation(() => ({
          call: vi.fn().mockReturnValue("mocked-call"),
        })),
      };
    });

    // Mock rate-limit-redis
    vi.mock("rate-limit-redis", () => {
      return {
        default: class MockRedisStore {
          constructor(public options: any) {}
          sendCommand(...args: any[]) {
            return this.options.sendCommand(...args);
          }
        },
      };
    });

    const { createStore } = await import("../../server/rateLimit");
    const store = createStore();
    expect(store).toBeDefined();

    // Test the sendCommand callback
    const result = store.sendCommand("PING", "arg1");
    expect(result).toBe("mocked-call");
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
