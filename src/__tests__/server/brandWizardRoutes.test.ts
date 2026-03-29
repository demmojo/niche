import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { brandWizardRouter } from "../../server/brandWizardRoutes";
import * as admin from "firebase-admin";

// Mock Firebase Admin
vi.mock("firebase-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin")>();
  const dbMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnValue({
      id: "mock-job-id",
      set: vi.fn().mockResolvedValue(undefined),
    }),
  };
  const firestoreMock = Object.assign(
    vi.fn(() => dbMock),
    {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
      },
    },
  );
  return {
    ...actual,
    default: {
      ...actual,
      firestore: firestoreMock,
    },
    firestore: firestoreMock,
  };
});

// Mock rate limiter to avoid delays
vi.mock("../../server/rateLimit", () => ({
  brandWizardLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock queue
vi.mock("../../server/queues", () => ({
  brandWizardQueue: {
    add: vi.fn().mockResolvedValue({ id: "mock-bullmq-job-id" }),
  },
}));

// Mock auth middleware for testing
vi.mock("../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (req.headers.authorization === "Bearer valid-token") {
      req.user = { uid: "test-user-id" };
      return next();
    }
    return res.status(401).json({ error: "Unauthorized" });
  },
}));

const app = express();
app.use(express.json());
app.use("/api/brand-wizard", brandWizardRouter);

describe("brandWizardRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /start", () => {
    it("returns 401 if unauthorized", async () => {
      const response = await request(app)
        .post("/api/brand-wizard/start")
        .send({});
      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid payload (missing projectId)", async () => {
      const response = await request(app)
        .post("/api/brand-wizard/start")
        .set("Authorization", "Bearer valid-token")
        .send({ urls: ["https://example.com"] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid payload");
    });

    it("returns 400 for invalid URLs (SSRF protection)", async () => {
      const response = await request(app)
        .post("/api/brand-wizard/start")
        .set("Authorization", "Bearer valid-token")
        .send({ projectId: "proj1", urls: ["http://localhost:8080"] });

      expect(response.status).toBe(400);
      expect(response.body.details[0].message).toBe("Invalid or blocked URL");
    });

    it("returns 202 and creates a job successfully", async () => {
      const response = await request(app)
        .post("/api/brand-wizard/start")
        .set("Authorization", "Bearer valid-token")
        .send({
          projectId: "proj1",
          urls: ["https://example.com", "https://anotherexample.com"],
        });

      expect(response.status).toBe(202);
      expect(response.body.jobId).toBe("mock-job-id");
      expect(response.body.message).toBe(
        "Brand Identity extraction job started.",
      );

      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith("brand_wizard_jobs");
      expect((db as any).doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "proj1",
          userId: "test-user-id",
          status: "pending",
          progress: { totalUrls: 2, completed: 0, failed: 0 },
        }),
      );
    });

    it("returns 500 on internal server error", async () => {
      const db = admin.firestore();
      ((db as any).doc().set as any).mockRejectedValueOnce(
        new Error("DB Error"),
      );

      const response = await request(app)
        .post("/api/brand-wizard/start")
        .set("Authorization", "Bearer valid-token")
        .send({ projectId: "proj1", urls: ["https://example.com"] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });
});
