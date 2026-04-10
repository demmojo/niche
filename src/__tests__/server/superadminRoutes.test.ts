import request from "supertest";
import express from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  superadminRouter,
  surfaceRoastHandler,
} from "../../server/superadminRoutes";
import * as admin from "firebase-admin";

// Mock dependencies
vi.mock("../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (req.headers.authorization === "Bearer mock-token-anon") {
      req.user = { isAnonymous: true };
      return next();
    }
    if (req.headers.authorization === "Bearer mock-token") {
      req.user = {
        uid: "user-123",
        email: "test@example.com",
        email_verified: true,
        isAnonymous: false,
      };
      return next();
    }
    return res.status(401).json({ error: "Unauthorized" });
  },
}));

vi.mock("firebase-admin", () => {
  const addDocMock = vi.fn().mockResolvedValue({ id: "doc-123" });
  return {
    firestore: Object.assign(
      vi.fn(() => ({
        collection: vi.fn(() => ({
          add: addDocMock,
        })),
      })),
      {
        FieldValue: {
          serverTimestamp: vi.fn(),
        },
      },
    ),
  };
});

vi.mock("../../server/agents/DataGatherer", () => ({
  DataGatherer: vi.fn().mockImplementation(() => ({
    gather: vi.fn().mockResolvedValue({ exaResults: [], apolloKeywords: [] }),
  })),
}));

vi.mock("../../server/agents/ReportSynthesizer", () => ({
  ReportSynthesizer: vi.fn().mockImplementation(() => ({
    synthesize: vi.fn().mockResolvedValue({
      draftMarkdown: "mock",
      tarpitScore: 0,
      wasOverridden: false,
    }),
  })),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({ bullets: ["1", "2", "3"] }),
      }),
    },
  })),
}));

const app = express();
app.use(express.json());
app.use("/api/campaign", superadminRouter);
app.post("/api/llm/surface-roast", surfaceRoastHandler);

describe("superadminRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/campaign/submit-lead", () => {
    it("should return 400 if missing idea or email", async () => {
      const res = await request(app)
        .post("/api/campaign/submit-lead")
        .set("Authorization", "Bearer mock-token")
        .send({ idea: "test" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Idea and email are required");
    });

    it("should return 401 if unauthorized", async () => {
      const res = await request(app)
        .post("/api/campaign/submit-lead")
        .send({ idea: "test", email: "test@example.com" });
      expect(res.status).toBe(401);
    });

    it("should return 202 and process successfully", async () => {
      const res = await request(app)
        .post("/api/campaign/submit-lead")
        .set("Authorization", "Bearer mock-token")
        .send({ idea: "Great idea", email: "test@example.com" });
      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);

      // Give async pipeline a tiny moment
      await new Promise((r) => setTimeout(r, 50));
    });

    it("should return 202 and process successfully for anonymous users (branch coverage)", async () => {
      const res = await request(app)
        .post("/api/campaign/submit-lead")
        .set("Authorization", "Bearer mock-token-anon")
        .send({ idea: "Great idea", email: "anon@example.com" });

      expect(res.status).toBe(202);
      await new Promise((r) => setTimeout(r, 50));
    });

    it("should catch errors and return 500", async () => {
      vi.mocked(admin.firestore).mockImplementationOnce(() => {
        throw new Error("DB Error");
      });
      const res = await request(app)
        .post("/api/campaign/submit-lead")
        .set("Authorization", "Bearer mock-token")
        .send({ idea: "Great idea", email: "test@example.com" });
      expect(res.status).toBe(500);
    });

    it("should cover async pipeline error without crashing response", async () => {
      const { DataGatherer } = await import("../../server/agents/DataGatherer");
      vi.mocked(DataGatherer).mockImplementationOnce(() => {
        throw new Error("Async pipeline failed");
      });

      const res = await request(app)
        .post("/api/campaign/submit-lead")
        .set("Authorization", "Bearer mock-token")
        .send({ idea: "Great idea", email: "test@example.com" });
      expect(res.status).toBe(202);

      // Give async pipeline a tiny moment
      await new Promise((r) => setTimeout(r, 50));
    });
  });

  describe("POST /api/llm/surface-roast", () => {
    it("should return 400 if idea is missing", async () => {
      const res = await request(app).post("/api/llm/surface-roast").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Idea is required");
    });

    it("should return 200 with bullets", async () => {
      process.env.GEMINI_API_KEY = "mock-key";
      const res = await request(app)
        .post("/api/llm/surface-roast")
        .send({ idea: "Bad idea" });
      expect(res.status).toBe(200);
      expect(res.body.bullets).toEqual(["1", "2", "3"]);
    });

    it("should handle empty response.text gracefully (branch coverage)", async () => {
      process.env.GEMINI_API_KEY = "mock-key";
      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementationOnce(
        () =>
          ({
            models: {
              generateContent: vi.fn().mockResolvedValue({}),
            },
          }) as any,
      );

      const res = await request(app)
        .post("/api/llm/surface-roast")
        .send({ idea: "Bad idea" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });

    it("should return 500 if missing API key", async () => {
      delete process.env.GEMINI_API_KEY;
      const res = await request(app)
        .post("/api/llm/surface-roast")
        .send({ idea: "Bad idea" });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to generate roast.");
    });
  });
});
