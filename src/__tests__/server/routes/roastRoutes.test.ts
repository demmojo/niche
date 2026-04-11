import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { roastRoutes } from "../../../server/routes/roastRoutes";
import { server } from "../../../test-utils/server";
import * as rateLimitCounters from "../../../server/utils/rateLimitCounters";

vi.mock("firebase-admin", () => {
  const setMock = vi.fn().mockResolvedValue(true);
  const docMock = vi.fn().mockReturnValue({
    id: "job-mock-id",
    set: setMock,
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

vi.mock("../../../server/utils/rateLimitCounters", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  incrementRateLimitCounter: vi.fn().mockResolvedValue(undefined),
}));

const app = express();
// The express.json() with limit should be applied in the router or app.
// We expect the router to enforce it, or it will fail here.
app.use("/api/roast", roastRoutes);

beforeAll(() => {
  // Explicitly disable MSW or configure it to bypass localhost requests to prevent Supertest conflicts
  if (server) {
    server.close();
  }
});

describe("Phase 1: POST /api/roast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimitCounters.checkRateLimit).mockResolvedValue(true);
  });

  it("should enforce a 100kb payload limit", async () => {
    // Generate a payload larger than 100kb
    const largeString = "a".repeat(101 * 1024);
    
    const response = await request(app)
      .post("/api/roast")
      .send({ idea: largeString });

    expect(response.status).toBe(413); // Payload Too Large
  });

  it("should return 202 Accepted with a jobId and phase 1 fast data for valid payloads", async () => {
    // Mock the tenant scope / user id if required, or test anonymous usage
    const response = await request(app)
      .post("/api/roast")
      .send({ idea: "An AI tool for founders", owner_uid: "test-user-123" });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty("jobId", "job-mock-id");
    expect(response.body).toHaveProperty("status", "accepted");
    // Verify Phase 1 Two-Phase Fetch behavior (returning immediately to replace spinners)
    expect(response.body).toHaveProperty("message");

    expect(rateLimitCounters.checkRateLimit).toHaveBeenCalledWith("test-user-123", 5);
    expect(rateLimitCounters.incrementRateLimitCounter).toHaveBeenCalledWith("test-user-123");
  });

  it("should return 429 if rate limit is exceeded", async () => {
    vi.mocked(rateLimitCounters.checkRateLimit).mockResolvedValueOnce(false);
    
    const response = await request(app)
      .post("/api/roast")
      .send({ idea: "An AI tool for founders", owner_uid: "test-user-123" });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: "Rate limit exceeded" });
  });
});
