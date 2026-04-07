import request from "supertest";
import express from "express";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nicheRouter } from "../../../server/routes/nicheRoutes";
import { requireAuth } from "../../../server/authMiddleware";
import admin from "firebase-admin";

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
      searchAndContents = async () => {
        if ((globalThis as any).__EXA_THROW__) {
          throw (globalThis as any).__EXA_THROW__;
        }
        return {
          results: [{ url: "https://tarpit1.com", text: "Tarpit 1 details" }],
        };
      };
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
  const getMock = async () =>
    globalThis.__FIRESTORE_GET_MOCK__
      ? globalThis.__FIRESTORE_GET_MOCK__()
      : { empty: true };
  const firestoreReturn = {
    collection: () => ({
      where: () => ({
        limit: () => ({
          get: getMock,
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

    it("should handle cache hit and return sub-second response", async () => {
      // Mock cache hit
      (globalThis as any).__FIRESTORE_GET_MOCK__ = vi.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => ({
              cached_result: { idea: "AI for legal cache", competitors: [] },
            }),
          },
        ],
      });

      const response = await request(app)
        .post("/api/niche/validate-jit")
        .send({ idea: "AI for legal cache" })
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        idea: "AI for legal cache",
        competitors: [],
      });
    });

    it("should stream results and dispatch cloud task for new idea", async () => {
      // Restore cache miss
      (globalThis as any).__FIRESTORE_GET_MOCK__ = vi
        .fn()
        .mockResolvedValue({ empty: true });

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
    it("should catch AbortError in stream", async () => {
      (globalThis as any).__FIRESTORE_GET_MOCK__ = vi
        .fn()
        .mockResolvedValue({ empty: true });
      const abortError = new Error("aborted");
      abortError.name = "AbortError";
      (globalThis as any).__EXA_THROW__ = abortError;

      const response = await request(app)
        .post("/api/niche/validate-jit")
        .send({ idea: "AI for legal abort" })
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(200); // the stream already started with 200 before the error
      expect(response.text).not.toContain("Internal Server Error");

      delete (globalThis as any).__EXA_THROW__;
    });

    it("should catch generic error in stream and write error event", async () => {
      (globalThis as any).__FIRESTORE_GET_MOCK__ = vi
        .fn()
        .mockResolvedValue({ empty: true });
      (globalThis as any).__EXA_THROW__ = new Error("Exa rate limit");

      const response = await request(app)
        .post("/api/niche/validate-jit")
        .send({ idea: "AI for legal generic error" })
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(200);
      expect(response.text).toContain("event: error");
      expect(response.text).toContain("Exa rate limit");

      delete (globalThis as any).__EXA_THROW__;
    });

    it("should handle generic error outside stream and return 500", async () => {
      (globalThis as any).__FIRESTORE_GET_MOCK__ = vi
        .fn()
        .mockRejectedValue(new Error("DB failure"));

      const response = await request(app)
        .post("/api/niche/validate-jit")
        .send({ idea: "AI for legal" })
        .set("Accept", "text/event-stream");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal Server Error" });
    });
  });
});
