import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import express from "express";

const { mockCreateTask } = vi.hoisted(() => ({
  mockCreateTask: vi.fn().mockResolvedValue([{ name: "mock-task" }]),
}));

vi.mock("@google-cloud/tasks", () => {
  return {
    CloudTasksClient: vi.fn().mockImplementation(() => {
      return {
        queuePath: vi.fn().mockReturnValue("mock-queue-path"),
        createTask: mockCreateTask,
      };
    }),
  };
});

import { roastRoutes } from "../../../server/routes/roastRoutes";
import { server } from "../../../test-utils/server";

const { mockSet } = vi.hoisted(() => ({ mockSet: vi.fn() }));

vi.mock("firebase-admin", () => {
  const setMock = vi.fn().mockResolvedValue(true);
  const updateMock = vi.fn().mockResolvedValue(true);
  const docMock = vi.fn().mockReturnValue({
    id: "job-mock-id",
    set: mockSet,
    update: updateMock,
  });
  const collectionMock = vi.fn().mockReturnValue({
    doc: docMock,
  });
  const firestoreMock = vi.fn().mockReturnValue({
    collection: collectionMock,
  });
  (firestoreMock as any).FieldValue = {
    serverTimestamp: vi.fn().mockReturnValue("mocked-timestamp"),
  };
  return {
    firestore: firestoreMock,
  };
});

// Since the test requires testing TOCTOU rate limits using Promise.all,
// we expect the route to implement a rate limiting function that handles concurrent requests safely.
vi.mock("../../../server/utils/rateLimitCounters", () => {
  const counters = new Map();
  return {
    checkRateLimit: vi.fn().mockResolvedValue(true),
    incrementRateLimitCounter: vi.fn().mockResolvedValue(undefined),
    atomicRateLimitCheck: vi.fn().mockImplementation(async (uid, limit) => {
      const current = counters.get(uid) || 0;
      if (current >= (limit || 5)) return false;
      counters.set(uid, current + 1);
      return true;
    }),
  };
});

const app = express();
// The express.json() with strict limit and type should be applied inside the router to protect it
app.use("/api/roast", roastRoutes);

beforeAll(() => {
  if (server) {
    server.close();
  }
});

describe("Phase 1: POST /api/roast (RED Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Payload & Content-Type Constraints", () => {
    it("should enforce a 100kb payload limit", async () => {
      const largeString = "a".repeat(101 * 1024);
      const response = await request(app)
        .post("/api/roast")
        .set("Content-Type", "application/json")
        .send({ idea: largeString });

      expect(response.status).toBe(413); // Payload Too Large
    });

    it("should reject invalid Content-Types and only accept application/json and application/csp-report", async () => {
      const responseText = await request(app)
        .post("/api/roast")
        .set("Content-Type", "text/plain")
        .send('{"idea": "An AI tool for founders"}');

      // The express.json({ type: ['application/json', 'application/csp-report'] })
      // should ignore or reject other content types (usually results in an empty body or 415)
      expect(responseText.status).toBe(415); // Unsupported Media Type or 400
    });
  });

  describe("202 Claim-Check & Floating Promises", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });
    it("should return 202 Accepted with a jobId and handle the background work with a floating promise", async () => {
      // Mock the background worker that simulates a long-running task
      // We'll attach a catch to handle rejections synchronously as required by AGENTS.md
      let floatingPromiseResolved = false;

      // Assume the route sets up a claim check in firestore, then processes
      mockSet.mockImplementation(async () => {
        return new Promise((resolve) =>
          setTimeout(() => {
            floatingPromiseResolved = true;
            resolve(true);
          }, 5000),
        );
      });

      // The HTTP response should return immediately (202 Accepted)
      const promise = request(app)
        .post("/api/roast")
        .set("Content-Type", "application/json")
        .send({ idea: "An AI tool for founders", owner_uid: "test-user-123" });

      // We don't advance timers yet, so the response must come back synchronously
      const response = await promise;

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty("jobId");
      expect(response.body).toHaveProperty("claimCheckPath"); // Required by AGENTS.md for large payloads / claim check pattern

      // Floating promise is still pending
      expect(floatingPromiseResolved).toBe(false);

      // Now flush timers to finish the background task
      await vi.runAllTimersAsync();

      // Ensure the background task completes
      expect(floatingPromiseResolved).toBe(true);
      expect(mockSet).toHaveBeenCalled();
    });

    it("should safely handle errors in the floating promise without crashing", async () => {
      // The background floating promise throws an error
      mockSet.mockImplementation(async () => {
        return new Promise((_, reject) =>
          setTimeout(() => {
            reject(new Error("Background worker crash"));
          }, 5000),
        );
      });

      const response = await request(app)
        .post("/api/roast")
        .set("Content-Type", "application/json")
        .send({ idea: "An AI tool for founders", owner_uid: "test-user-123" });

      expect(response.status).toBe(202); // HTTP still succeeds

      // Advance timers to trigger the rejection
      // The application should have a .catch(() => {}) attached to the promise to prevent UnhandledPromiseRejection
      await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    });
  });

  describe("TOCTOU Rate Limits", () => {
    it("should prevent TOCTOU race conditions when multiple concurrent requests hit the endpoint", async () => {
      // Simulate multiple concurrent requests for the same user
      // A naive rate limiter (read then write) would allow all to pass if they hit simultaneously
      // The endpoint must use Promise.all and atomic distributed counters/transactions

      const makeRequest = () =>
        request(app)
          .post("/api/roast")
          .set("Content-Type", "application/json")
          .send({ idea: "An AI tool for founders", owner_uid: "toctou-user" });

      const responses = await Promise.all([
        makeRequest(),
        makeRequest(),
        makeRequest(),
        makeRequest(),
        makeRequest(),
        makeRequest(), // 6 requests
      ]);

      // Assuming limit is 5, exactly 5 should pass and 1 should fail with 429
      const successes = responses.filter((r) => r.status === 202);
      const failures = responses.filter((r) => r.status === 429);

      // This will FAIL if the route uses non-atomic rate limiting
      expect(successes.length).toBe(5);
      expect(failures.length).toBe(1);
    });
  });
});
