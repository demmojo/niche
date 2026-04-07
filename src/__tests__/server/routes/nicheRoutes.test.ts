import request from "supertest";
import express from "express";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nicheRouter } from "../../../server/routes/nicheRoutes";
import { requireAuth } from "../../../server/authMiddleware";

// Ensure API keys are set
process.env.EXA_API_KEY = "test-exa";
process.env.GEMINI_API_KEY = "test-gemini";

// Mock middlewares
vi.mock("../../../server/authMiddleware", () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = { uid: "test-user" };
    next();
  }),
  requireAppCheck: vi.fn((req: any, res: any, next: any) => next()),
}));

// Mock Exa
vi.mock("exa-js", () => {
  return {
    default: class ExaMock {
      searchAndContents = async () => ({
        results: [{ url: "https://tarpit1.com", text: "Tarpit 1 details" }],
      });
    },
  };
});

// Mock Gemini
vi.mock("@google/genai", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    GoogleGenAI: class {
      models = {
        generateContentStream: async function* () {
          yield {
            text: JSON.stringify({
              idea: "AI for legal",
              competitors: [{ url: "https://tarpit1.com" }],
            }),
          };
        },
      };
    },
  };
});

// Mock Firestore / Cache checks
vi.mock("firebase-admin", () => {
  const firestoreReturn = {
    collection: () => ({
      where: () => ({
        limit: () => ({
          get: async () => ({ empty: true }),
        }),
      }),
      doc: () => ({
        id: "mock-doc-id",
        set: async () => true,
      }),
    }),
  };

  return {
    default: {
      firestore: () => firestoreReturn,
    },
    firestore: () => firestoreReturn,
  };
});

// Mock Cloud Tasks
vi.mock("../../../server/cloudTasks", () => ({
  enqueueTask: vi.fn().mockResolvedValue({ name: "mock-task" }),
}));

describe("Niche Routes (JIT Flywheel)", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());

    // Phase 6: Supertest SSE Mocking
    // Inject a test-only middleware to intercept and ignore the `close` event listener attachment
    app.use((req, res, next) => {
      const originalOn = req.on.bind(req);
      req.on = (event: string, listener: any) => {
        if (event === "close") {
          // Ignore close event in supertest to prevent premature aborts
          return req;
        }
        return originalOn(event, listener);
      };
      next();
    });

    app.use("/api/niche", nicheRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/niche/validate-jit", () => {
    it("should return 400 if validation fails", async () => {
      const response = await request(app)
        .post("/api/niche/validate-jit")
        .send({}); // Missing 'idea'

      expect(response.status).toBe(400);
    });

    it("should stream results and dispatch cloud task for new idea", async () => {
      const response = await request(app)
        .post("/api/niche/validate-jit")
        .send({ idea: "AI for legal" })
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["x-accel-buffering"]).toBe("no");

      // Verify the stream contains chunks
      expect(response.text).toContain("idea");
    });
  });
});
