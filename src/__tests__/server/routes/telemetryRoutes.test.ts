import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { telemetryRouter } from "../../../server/routes/telemetryRoutes";
import * as admin from "firebase-admin";

const mockBatch = {
  set: vi.fn(),
  commit: vi.fn().mockResolvedValue(true),
};

vi.mock("firebase-admin", () => {
  const mockCollection = vi.fn().mockReturnThis();
  const mockDoc = vi.fn().mockReturnThis();

  const firestoreMock = Object.assign(
    vi.fn(() => ({
      collection: mockCollection,
      doc: mockDoc,
      batch: vi.fn(() => mockBatch),
    })),
    {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue("mock-server-timestamp"),
      },
    },
  );

  return {
    default: {
      firestore: firestoreMock,
      app: vi.fn().mockReturnValue({ options: { projectId: "test-project" } }),
      apps: [{ name: "[DEFAULT]" }],
    },
    firestore: firestoreMock,
    app: vi.fn().mockReturnValue({ options: { projectId: "test-project" } }),
    apps: [{ name: "[DEFAULT]" }],
  };
});

vi.mock("../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "Bearer VALID_TOKEN") {
      req.user = { uid: "test-user", email: "user@example.com" };
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  },
}));

vi.mock("../../server/rateLimit", () => ({
  telemetryLimiter: (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/telemetry", telemetryRouter);

describe("routes/telemetryRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /v1/ui-sync", () => {
    it("should process ui-sync correctly", async () => {
      const validPayload = [
        {
          eventId: "e4f8d956-6512-4217-a063-2287eb178351",
          schemaVersion: "v1",
          eventType: "revenue_signal",
          clientTimestamp: Date.now(),
          eventName: "compute_upgrade",
          actorType: "human",
          upgradeType: "plan_a",
          provider: "openai",
        },
      ];

      const res = await request(app)
        .post("/api/telemetry/v1/ui-sync")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ events: validPayload });

      expect(res.status).toBe(200);
      expect(mockBatch.set).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it("should return 200 and drop bad payload items", async () => {
      const invalidPayload = [
        {
          eventId: "e4f8d956-6512-4217-a063-2287eb178351",
          schemaVersion: "v1", // Missing eventName and actorType
        },
      ];

      const res = await request(app)
        .post("/api/telemetry/v1/ui-sync")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ events: invalidPayload });

      expect(res.status).toBe(200);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it("returns 200 on empty array", async () => {
      const res = await request(app)
        .post("/api/telemetry/v1/ui-sync")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ events: [] });

      expect(res.status).toBe(200);
      expect(mockBatch.set).not.toHaveBeenCalled();
    });
  });
});
