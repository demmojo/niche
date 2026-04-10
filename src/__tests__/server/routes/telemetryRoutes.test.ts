import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { telemetryRouter } from "../../../server/routes/telemetryRoutes";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

const mockBatch = {
  set: vi.fn(),
  commit: vi.fn().mockResolvedValue(true),
};

const mockGet = vi.fn();
const mockLimit = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockCollection = vi.fn().mockReturnThis();
const mockDoc = vi.fn().mockReturnThis();

vi.mock("firebase-admin", () => {
  const firestoreMock = Object.assign(
    vi.fn(() => ({
      collection: (path: string) => {
        mockCollection(path);
        return {
          doc: mockDoc,
          orderBy: () => ({
            limit: () => ({
              get: mockGet,
            }),
          }),
        };
      },
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

vi.mock("../../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (
      authHeader === "Bearer VALID_TOKEN" ||
      authHeader === "Bearer SUPERADMIN_TOKEN"
    ) {
      req.user = { uid: "test-user", email: "user@example.com" };
      next();
    } else if (authHeader === "Bearer NO_USER_TOKEN") {
      // Don't set req.user
      next();
    } else if (authHeader === "Bearer USER_WITHOUT_UID_TOKEN") {
      req.user = { email: "test@example.com" };
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  },
}));

vi.mock("../../../server/superadminRoutes", () => ({
  requireSuperadmin: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "Bearer SUPERADMIN_TOKEN") {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Superadmin only" });
    }
  },
}));

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

// GCP Cloud Armor handles edge rate limiting

const app = express();
app.use(express.json());
app.use("/api/telemetry", telemetryRouter);

describe("routes/telemetryRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /v1/ui-sync", () => {
    it("should return 400 if events is missing or not an array", async () => {
      const res = await request(app)
        .post("/api/telemetry/v1/ui-sync")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ events: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Events array is required" });

      const res2 = await request(app)
        .post("/api/telemetry/v1/ui-sync")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({});

      expect(res2.status).toBe(400);
    });

    it("should process ui-sync correctly without user ID", async () => {
      // Mock authMiddleware to not set req.user (e.g. valid token but no user object, though realistic or not)
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
        .set("Authorization", "Bearer NO_USER_TOKEN")
        .send({ events: validPayload });

      expect(res.status).toBe(200);
      expect(mockBatch.set).toHaveBeenCalledTimes(1);
    });

    it("should process ui-sync correctly with user but no uid", async () => {
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
        .set("Authorization", "Bearer USER_WITHOUT_UID_TOKEN")
        .send({ events: validPayload });

      expect(res.status).toBe(200);
      expect(mockBatch.set).toHaveBeenCalledTimes(1);
    });

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

    it("should handle error during ui-sync gracefully", async () => {
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

      mockBatch.commit.mockRejectedValueOnce(new Error("Firestore Error"));

      const res = await request(app)
        .post("/api/telemetry/v1/ui-sync")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ events: validPayload });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
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
      expect(mockBatch.set).not.toHaveBeenCalled();
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

  describe("POST /v1/summary", () => {
    it("should return 401 if unauthorized", async () => {
      const res = await request(app).post("/api/telemetry/v1/summary");
      expect(res.status).toBe(401);
    });

    it("should return 403 if not superadmin", async () => {
      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer VALID_TOKEN");
      expect(res.status).toBe(403);
    });

    it("should generate strategic summary successfully", async () => {
      mockGet.mockResolvedValueOnce({
        docs: [
          { data: () => ({ eventType: "activation" }) },
          { data: () => ({ eventType: "core_action" }) },
          { data: () => ({ eventType: "retention_proxy" }) },
          { data: () => ({ eventType: "revenue_signal" }) },
          { data: () => ({ eventType: "unknown" }) },
        ],
      });

      const fakeAiResponse = {
        strategic_summary: "Test summary",
        action_items: ["Item 1"],
        referenced_metrics: [{ metric_name: "Total Events", exact_value: 5 }],
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(fakeAiResponse),
      });

      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer SUPERADMIN_TOKEN");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeAiResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("should handle gemini failure and return 500", async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      mockGenerateContent.mockRejectedValueOnce(new Error("Gemini API Error"));

      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer SUPERADMIN_TOKEN");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to generate summary" });
    });

    it("should handle missing gemini response text", async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: undefined, // Simulating empty response text
      });

      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer SUPERADMIN_TOKEN");

      // It will throw JSON parse error, and then 500
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to generate summary" });
    });

    it("should return 500 if AI generates invalid JSON schema", async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({ bad_schema: true }), // Missing required fields
      });

      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer SUPERADMIN_TOKEN");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to generate summary" });
    });
  });
});
