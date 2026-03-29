import request from "supertest";
import express from "express";
import { describe, it, expect, vi } from "vitest";
import { scoringRouter } from "../../server/scoringRoutes";

// Mock middleware
vi.mock("../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { uid: "test-user" };
    next();
  },
  requireAppCheck: (req: any, res: any, next: any) => next(),
}));

// Mock tarpitFlywheel
vi.mock("../../services/tarpitFlywheel", () => ({
  storeTarpitQuery: vi.fn().mockResolvedValue(null),
}));

// Mock Exa
vi.mock("exa-js", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      searchAndContents: vi.fn().mockResolvedValue({
        results: [{ url: "https://exa.ai", text: "Exa" }],
      }),
    })),
  };
});

// Mock Gemini
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            hasEstablishedIncumbents: true,
            commodityFeatureSet: false,
            highChurnLanguage: false,
            score: 0.5,
            rationale: "Test reasoning",
            exa_url: "https://exa.ai",
          }),
        }),
        embedContent: vi.fn().mockResolvedValue({
          embeddings: [{ values: new Array(768).fill(0.1) }],
        }),
      },
    })),
  };
});

const app = express();
app.use(express.json());
app.use("/api/scoring", scoringRouter);

describe("scoringRoutes", () => {
  it("should process analysis successfully", async () => {
    process.env.EXA_API_KEY = "test-key";
    process.env.GEMINI_API_KEY = "test-key";

    const res = await request(app)
      .post("/api/scoring/tarpit-analyze")
      .send({ productName: "Test", productDescription: "Desc" });
    console.log(res.body);
    expect(res.status).toBe(200);
  });
});
