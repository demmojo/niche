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
    it("should synchronously set the Firestore document with a TTL, dispatch a Cloud Task, and return 202 Accepted", async () => {
      // For this test, we expect the synchronous db.set and task dispatch to complete before returning 202.
      // We do not use fake timers because they cause issues with Express and Supertest.
      let floatingPromiseResolved = false;

      // Assume the route sets up a claim check in firestore, then processes
      mockSet.mockImplementation(async (data: any) => {
        return new Promise((resolve) =>
          setTimeout(() => {
            floatingPromiseResolved = true;
            resolve(true);
          }, 100),
        );
      });

      // The HTTP response should return immediately (202 Accepted)
      const promise = request(app)
        .post("/api/roast")
        .set("Content-Type", "application/json")
        .send({ idea: "An AI tool for founders", owner_uid: "test-user-123" });

      const response = await promise;

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty("jobId");
      expect(response.body).toHaveProperty("claimCheckPath"); // Required by AGENTS.md for large payloads / claim check pattern

      // Ensure Firestore document was set synchronously
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
          expiresAt: "mocked-timestamp", // TTL timestamp
          owner_uid: "test-user-123",
        }),
      );

      // Ensure Cloud Task was dispatched
      expect(mockCreateTask).toHaveBeenCalled();

      // Wait a bit to let the floating promise resolve
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Ensure the background task completes
      expect(floatingPromiseResolved).toBe(true);
    });

    it("should safely handle errors in the floating promise without crashing", async () => {
      // For this test, we expect the synchronous db.set and task dispatch to complete before returning 202.
      // But we simulate a failure in the task dispatch which is floating.
      // Wait, in roastRoutes.ts:
      // try { await jobRef.set(...); } catch (setErr) { res.status(500); return; }
      // The set is awaited, so if we mock mockSet to reject, it will return 500!
      // The test says "floating promise without crashing", but the floating promise is the tasksClient.createTask, not the db.set!
      mockSet.mockResolvedValue(true);
      mockCreateTask.mockRejectedValueOnce(
        new Error("Background worker crash"),
      );

      const response = await request(app)
        .post("/api/roast")
        .set("Content-Type", "application/json")
        .send({ idea: "An AI tool for founders", owner_uid: "test-user-123" });

      expect(response.status).toBe(202); // HTTP still succeeds

      // Wait to trigger the rejection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe("TOCTOU Rate Limits", () => {
    afterEach(() => {
      // Clean up the mock state if needed
    });
    it("should prevent TOCTOU race conditions when multiple concurrent requests hit the endpoint", async () => {
      // Simulate multiple concurrent requests for the same user
      // A naive rate limiter (read then write) would allow all to pass if they hit simultaneously
      // The endpoint must use Promise.all and atomic distributed counters/transactions

      // Reset mock Set to succeed for this test so we don't get 500s from the previous test's mock override
      mockSet.mockImplementation(async (data: any) => true);

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
