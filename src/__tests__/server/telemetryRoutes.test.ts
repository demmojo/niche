import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { telemetryRouter } from "../../server/telemetryRoutes";
import * as admin from "firebase-admin";

const mockGet = vi.fn();
vi.mock("firebase-admin", () => {
  const mockCollection = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockReturnThis();

  const firestoreMock = Object.assign(
    vi.fn(() => ({
      collection: mockCollection,
      where: mockWhere,
      get: mockGet,
    })),
    {
      Timestamp: {
        fromDate: vi.fn().mockReturnValue(new Date()),
      },
    },
  );

  return {
    default: { firestore: firestoreMock },
    firestore: firestoreMock,
  };
});

vi.mock("../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "Bearer VALID_TOKEN") {
      req.user = { uid: "test-admin-uid", email: "admin@example.com" };
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  },
}));

vi.mock("../../server/superadminRoutes", () => ({
  requireSuperadmin: (req: any, res: any, next: any) => next(),
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

const app = express();
app.use(express.json());
app.use("/api/telemetry", telemetryRouter);

describe("telemetryRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /v1/summary", () => {
    it("should return summary successfully", async () => {
      const mockDocs = [
        { data: () => ({ eventName: "market_driven_sync_commit" }) },
        {
          data: () => ({
            eventName: "lens_agent_evaluated",
            outcome: "accepted",
          }),
        },
        { data: () => ({ eventName: "compute_upgrade" }) },
      ];

      mockGet.mockResolvedValueOnce({
        size: 3,
        forEach: (cb: any) => mockDocs.forEach(cb),
        docs: mockDocs,
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          strategic_summary: "Good progress.",
          action_items: ["Do more of X"],
          referenced_metrics: [{ metric_name: "Total Events", exact_value: 3 }],
        }),
      });

      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ context: "Focus on retention." });

      expect(res.status).toBe(200);
      expect(res.body.strategic_summary).toBe("Good progress.");
      expect(res.body.referenced_metrics[0].exact_value).toBe(3);
    });

    it("should handle error when LLM response is invalid JSON", async () => {
      mockGet.mockResolvedValueOnce({
        size: 0,
        forEach: (cb: any) => [].forEach(cb),
        docs: [],
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: "Invalid JSON",
      });

      const res = await request(app)
        .post("/api/telemetry/v1/summary")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to generate AI summary.");
    });
  });
});
