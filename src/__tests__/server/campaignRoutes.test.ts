import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import * as genai from "@google/genai";

vi.mock("@google/genai", () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    text: JSON.stringify({
      subNiches: [{ name: "foo" }, { name: "bar" }, { name: "baz" }],
    }),
  });
  const embedContentMock = vi.fn().mockResolvedValue({
    embeddings: [{ values: new Array(768).fill(0.1) }],
  });
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: generateContentMock,
        embedContent: embedContentMock,
      },
    })),
    __generateContentMock: generateContentMock,
    __embedContentMock: embedContentMock,
  };
});

// Mock dependencies
vi.mock("../../server/credits", () => ({
  getActionCredits: vi.fn(),
  deductActionCredit: vi.fn(),
}));

vi.mock("firebase-admin", () => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const updateMock = vi.fn();
  const addMock = vi.fn().mockResolvedValue({ id: "mock-job-id" });

  const docMock = vi.fn(() => ({
    id: "mock-doc-id",
    get: getMock,
    set: setMock,
    update: updateMock,
  }));

  const collectionMock = vi.fn(() => {
    const whereMock = vi.fn().mockReturnThis();
    const getQueryMock = vi.fn().mockResolvedValue({ empty: true });

    return {
      doc: docMock,
      add: addMock,
      where: whereMock,
      get: getQueryMock,
    };
  });

  /**
   *
   */
  const firestoreInstanceMock = {
    collection: collectionMock,
    doc: vi.fn(() => ({
      get: getMock,
      set: setMock,
      update: updateMock,
      id: "mock-doc-id",
    })),
    runTransaction: vi.fn(),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn(),
    })),
  };

  const firestoreMock = vi.fn(() => firestoreInstanceMock) as any;

  firestoreMock.FieldValue = {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    increment: vi.fn((val) => `INCREMENT_BY_${val}`),
  };

  firestoreMock.Timestamp = {
    fromMillis: vi.fn((val) => `TIMESTAMP_${val}`),
  };

  /**
   *
   */
  const authMock = () => ({
    verifyIdToken: vi.fn(),
  });

  return {
    firestore: firestoreMock,
    auth: authMock,
    apps: [{ name: "[DEFAULT]" }],
  };
});

vi.mock("../../server/authMiddleware", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "Bearer VALID_TOKEN") {
      req.user = { uid: "test-uid", email: "test@example.com" };
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  },
  requireAppCheck: (req: any, res: any, next: any) => next(),
}));

vi.mock("../../server/rateLimit", () => ({
  campaignLimiter: (req: any, res: any, next: any) => next(),
  fakeDoorSignalLimiter: (req: any, res: any, next: any) => next(),
}));

vi.mock("../../server/queues", () => ({
  networkIoQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

// Import after mocking
import {
  campaignRouter,
  runDeepValidationCampaign,
  runTaxonomyEvaluation,
} from "../../server/campaignRoutes";
import * as admin from "firebase-admin";
import * as credits from "../../server/credits";

// Set up an ephemeral Express app for testing
const app = express();

// Parse JSON except for /signal so its specific limit applies
app.use((req: any, res: any, next: any) => {
  if (req.path === "/api/campaign/signal") {
    return next();
  }
  return express.json()(req, res, next);
});

// Mock auth middleware directly
app.use((req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (req.path === "/api/campaign/signal") {
    return next();
  }
  if (authHeader === "Bearer VALID_TOKEN") {
    req.user = { uid: "test-uid", email: "test@example.com" };
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.use("/api/campaign", campaignRouter);

describe("campaignRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (genai as any).__generateContentMock.mockReset();
    (genai as any).__embedContentMock.mockReset();

    // Restore default mocks
    (genai as any).__generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        subNiches: [{ name: "foo" }, { name: "bar" }, { name: "baz" }],
      }),
    });
    (genai as any).__embedContentMock.mockResolvedValue({
      embeddings: [{ values: new Array(768).fill(0.1) }],
    });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/campaign/start", () => {
    it("returns 401 if unauthorized", async () => {
      const response = await request(app)
        .post("/api/campaign/start")
        .send({ competitors: ["test"], baseIdea: { name: "test idea" } });

      expect(response.status).toBe(401);
    });

    it("returns 400 if competitors array is missing or empty and baseIdea lacks name", async () => {
      const response1 = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ baseIdea: {} });

      expect(response1.status).toBe(400);

      const response2 = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ competitors: [], baseIdea: {} });

      expect(response2.status).toBe(400);
    });

    it("returns 500 if an unexpected error occurs", async () => {
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(10);
      vi.mocked(credits.deductActionCredit).mockRejectedValueOnce(
        new Error("DB Connection Error"),
      );

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        "Billing system unavailable. Try again later.",
      );
    });

    it("returns 402 if insufficient action credits before deduction", async () => {
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(402);
      expect(response.body.message).toBe(
        "You have exhausted your monthly validation credits.",
      );
    });

    it("returns 402 if insufficient action credits", async () => {
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(10);
      vi.mocked(credits.deductActionCredit).mockRejectedValueOnce(
        new Error("Insufficient Action Credits."),
      );

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(402);
      expect(response.body.error).toBe("Insufficient Action Credits");
    });

    it("refunds credits and updates job status if queue fails", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(1);
      vi.mocked(credits.deductActionCredit).mockResolvedValue();

      const admin = await import("firebase-admin");
      const db = admin.firestore();

      const mockUpdate = vi.fn().mockResolvedValue(true);
      vi.mocked(db.collection).mockReturnValueOnce({
        add: vi
          .fn()
          .mockResolvedValue({ id: "mock-job-id", update: mockUpdate }),
      } as any);

      const { networkIoQueue } = await import("../../server/queues");
      vi.mocked(networkIoQueue.add).mockRejectedValueOnce(
        new Error("Queue Error"),
      );

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        "Failed to queue campaign. Your credits have been refunded.",
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed" }),
      );
    });

    it("logs critical error if refund fails", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(1);
      vi.mocked(credits.deductActionCredit)
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error("Refund Error"));

      const admin = await import("firebase-admin");
      const db = admin.firestore();

      vi.mocked(db.collection).mockReturnValueOnce({
        add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
      } as any);

      const { networkIoQueue } = await import("../../server/queues");
      vi.mocked(networkIoQueue.add).mockRejectedValueOnce(
        new Error("Queue Error"),
      );

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "CRITICAL: Failed to refund user after queue failure",
        ),
        expect.any(Object),
      );

      consoleErrorSpy.mockRestore();
    });

    it("returns 500 on unexpected error in POST /start (lines 221-223)", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockRejectedValueOnce(
        new Error("Unknown start error"),
      );

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal server error" });
    });

    it("returns 202 and creates a job if credits exist", async () => {
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(10);

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "test.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(202);
      expect(response.body.jobId).toBe("mock-job-id");
      expect(response.body.message).toBe("Campaign queued successfully.");
    });

    it("handles TOCTOU correctly with 50 concurrent requests (TC-CREDIT-01)", async () => {
      let availableCredits = 1;
      let inFlightDeductions = 0;

      vi.mocked(credits.getActionCredits).mockImplementation(
        async () => availableCredits,
      );

      vi.mocked(credits.deductActionCredit).mockImplementation(async () => {
        // Enforce strong serialization (like runTransaction does in reality)
        if (inFlightDeductions > 0) {
          throw new Error("Insufficient Action Credits."); // Another transaction got it first
        }
        inFlightDeductions++;

        if (availableCredits < 1) {
          inFlightDeductions--;
          throw new Error("Insufficient Action Credits.");
        }
        // Simulate async DB transaction delay
        await new Promise((resolve) => setTimeout(resolve, 5));
        availableCredits -= 1;
        inFlightDeductions--;
      });

      const promises = Array.from({ length: 50 }).map(() =>
        request(app)
          .post("/api/campaign/start")
          .set("Authorization", "Bearer VALID_TOKEN")
          .send({
            competitors: [{ name: "test" }],
            baseIdea: { name: "test idea" },
          }),
      );

      const responses = await Promise.all(promises);

      const successes = responses.filter((r) => r.status === 202);
      const errors = responses.filter((r) => r.status === 402); // 402 Insufficient credits

      // Only exactly 1 request should succeed and 49 should fail due to TOCTOU protection
      expect(successes.length).toBe(1);
      expect(errors.length).toBe(49);
      expect(availableCredits).toBe(0);

      vi.mocked(credits.getActionCredits).mockRestore();
      vi.mocked(credits.deductActionCredit).mockRestore();
    });

    it("should protect against Mass Assignment vulnerabilities via strict Zod validation", async () => {
      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [],
          baseIdea: {
            name: "New Startup",
            isAdmin: true, // Malicious field
            ownerId: "attacker_123", // Malicious field
          },
        });

      // Because we use .strict() in CampaignRequestSchema, it should reject this payload
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid request payload");
      expect(JSON.stringify(response.body.details)).toContain(
        "Unrecognized keys",
      );
    });

    it("should reject payload with full myProductData fields to prevent validation failures", async () => {
      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [],
          baseIdea: {
            name: "New Startup",
            description: "A cool idea",
            targetRegions: ["US", "UK"], // Extraneous field from myProductData
            features: [], // Extraneous field
            strategy: [], // Extraneous field
            allowAiWriteAccess: true, // Extraneous field
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid request payload");
      expect(JSON.stringify(response.body.details)).toContain(
        "Unrecognized keys",
      );
      expect(JSON.stringify(response.body.details)).toContain("targetRegions");
      expect(JSON.stringify(response.body.details)).toContain("features");
      expect(JSON.stringify(response.body.details)).toContain("strategy");
      expect(JSON.stringify(response.body.details)).toContain(
        "allowAiWriteAccess",
      );
    });
  });

  describe("POST /api/campaign/pivot", () => {
    it("returns 401 if unauthorized", async () => {
      const response = await request(app)
        .post("/api/campaign/pivot")
        .send({ competitors: [], baseIdea: { name: "test idea" } });

      expect(response.status).toBe(401);
    });

    it("returns 400 if payload is missing data", async () => {
      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({});

      expect(response.status).toBe(400);
    });

    it("returns 200 if responseText is already an object (line 90)", async () => {
      const genai = await import("@google/genai");
      console.log(
        "genai.__generateContentMock:",
        (genai as any).__generateContentMock,
      );
      (genai as any).__generateContentMock.mockResolvedValueOnce({
        text: { pivot: "Object Pivot" },
      });

      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "comp1" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ pivot: "Object Pivot" });
    });

    it("returns 500 if LLM extraction fails (lines 94-98)", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockRejectedValueOnce(
        new Error("LLM Error"),
      );

      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "foo.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("LLM Error");
    });

    it("returns 500 if unexpected error happens (default message)", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockRejectedValueOnce({});

      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "foo.com" }],
          baseIdea: { name: "test idea" },
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to generate sub-niches");
    });

    it("deducts credit and returns mock pivot data", async () => {
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();

      // Mock the generative API response logic
      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          competitors: [{ name: "foo.com" }],
          baseIdea: { name: "test idea" },
        });

      // Because the GenAI mock returns valid JSON stringified in the wrapper or we can mock it here directly
      expect(response.status).toBe(200);
      expect(credits.deductActionCredit).toHaveBeenCalledWith("test-uid");
    });
  });

  describe("runDeepValidationCampaign (Background worker)", () => {
    it("handles invalid embeddings properly (lines 267-268)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockResolvedValueOnce({
        embeddings: [],
      });

      const competitors = [{ domain: "comp0.com" }];

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-inv", "user", competitors, "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      const jobRef = db.collection("campaign_jobs").doc("job-inv");

      expect(jobRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", progress: 1 }),
      );
    });

    it("handles extraction zod parse failure (lines 286-287)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockResolvedValueOnce({
        embeddings: [{ values: new Array(768).fill(0.1) }],
      });

      const { LLMExtractionSchema } = await import("../../utils/scoringEngine");
      vi.spyOn(LLMExtractionSchema, "safeParse").mockReturnValueOnce({
        success: false,
        error: new Error(),
      } as any);

      const competitors = [{ domain: "compZod.com" }];

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-zod", "user", competitors, "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(
        db.collection("campaign_jobs").doc("job-zod").update,
      ).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    });

    it("handles validateExaUrl failure (lines 290-293)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockResolvedValueOnce({
        embeddings: [{ values: new Array(768).fill(0.1) }],
      });

      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(scoringEngine, "validateExaUrl").mockReturnValueOnce(false);

      const competitors = [{ domain: "compExa.com" }];

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-exa", "user", competitors, "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(
        db.collection("campaign_jobs").doc("job-exa").update,
      ).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    });

    it("handles missing base idea embeddings (lines 383)", async () => {
      const mockEmbedContent = vi.fn().mockImplementation((args: any) => {
        if (args.contents === "base") {
          return Promise.resolve({ embeddings: [] }); // missing values
        }
        return Promise.resolve({
          embeddings: [{ values: new Array(768).fill(0.1) }],
        });
      });

      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockImplementationOnce(
        mockEmbedContent,
      );

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");
      await runDeepValidationCampaign(
        "job-miss",
        "user",
        [{ domain: "compMiss.com" }],
        "base",
      );

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(
        db.collection("campaign_jobs").doc("job-miss").update,
      ).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    });

    it("applies wedge override if isTarpit and maxWedge > 0.85 (lines 400-403)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockResolvedValueOnce({
        embeddings: [{ values: new Array(768).fill(0.1) }],
      });

      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(
        scoringEngine,
        "calculateSquaredOrthogonalDistance",
      ).mockReturnValue(
        0.81, // 0.9^2 = 0.81
      );
      vi.spyOn(scoringEngine, "calculateTarpitScore").mockReturnValue({
        status: "success",
        score: 85,
        isTarpit: true,
      });

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");
      await runDeepValidationCampaign(
        "job-wedge",
        "user",
        [{ domain: "compWedge.com" }],
        "base",
      );

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(
        db.collection("campaign_jobs").doc("job-wedge").update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          scoreResult: expect.objectContaining({
            isTarpit: false,
            message: expect.stringMatching(
              /Wedge metric overrides Tarpit score/,
            ),
          }),
        }),
      );
    });

    it("returns 1.0 uniqueness if no enrichments succeed (line 383)", async () => {
      const mockEmbedContent = vi.fn().mockImplementation((args: any) => {
        if (args.contents === "base") {
          return Promise.resolve({
            embeddings: [{ values: new Array(768).fill(0.1) }],
          });
        }
        return Promise.reject(new Error("Network Error"));
      });

      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockImplementationOnce(
        mockEmbedContent,
      );

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");
      await runDeepValidationCampaign(
        "job-none",
        "user",
        [{ domain: "compNone.com" }],
        "base",
      );

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(
        db.collection("campaign_jobs").doc("job-none").update,
      ).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    });

    it("handles batching and resolves successfully (TC-BATCH-01)", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const competitors = Array.from({ length: 5 }).map((_, i) => ({
        domain: `comp${i}.com`,
      }));

      const promise = runDeepValidationCampaign(
        "job-123",
        "user-456",
        competitors,
        "base",
      );

      // Advance timers to trigger `p-map` async processing
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).resolves.toBeUndefined();

      const db = admin.firestore();
      const jobRef = db.collection("campaign_jobs").doc("job-123");
      expect(jobRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", progress: 5 }),
      );

      vi.useRealTimers();
    });

    it("handles chaos testing: artificially rejects 1 in 10 promises but completes (TC-BATCH-02)", async () => {
      let callCount = 0;
      const mockEmbedContent = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 3) {
          return Promise.reject(new Error("Chaos failure"));
        }
        return Promise.resolve({
          embeddings: [{ values: new Array(768).fill(0.1) }],
        });
      });

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({
        text: JSON.stringify({ subNiches: [{ name: "foo" }] }),
      });
      (genai as any).__embedContentMock.mockImplementation(mockEmbedContent);

      const competitors = Array.from({ length: 10 }).map((_, i) => ({
        domain: `comp${i}.com`,
      }));

      await runDeepValidationCampaign(
        "job-chaos",
        "user-chaos",
        competitors,
        "base",
      );

      const db = admin.firestore();
      const jobRef = db.collection("campaign_jobs").doc("job-chaos");

      expect(jobRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", progress: 10 }),
      );

      // 10 competitors + 1 base idea = 11 calls to embedContent
      // The 3rd call failed, meaning 1 competitor enrichment failed.
      // So 9 successful competitor enrichments.
      const updateCall = vi
        .mocked(jobRef.update)
        .mock.calls.find((call) => (call[0] as any).status === "completed");
      expect((updateCall![0] as any).results.length).toBe(9);
    });
  });

  describe("POST /api/campaign/signal", () => {
    it("returns 200 and acts as a honeypot if website_url is provided (lines 565-568)", async () => {
      const response = await request(app).post("/api/campaign/signal").send({
        productId: "prod-1",
        eventType: "view",
        website_url: "http://spam.com",
      });
      if (response.status !== 200) console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Signal recorded");
    });

    it("returns 200 and records CTA click signal successfully", async () => {
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "cta_click" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("returns 200 and records email submit signal successfully", async () => {
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "email_submit" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("returns 403 if Turnstile response is missing when TURNSTILE_SECRET_KEY is set", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_key";
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "view" });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Missing Turnstile verification");
      delete process.env.TURNSTILE_SECRET_KEY;
    });

    it("returns 403 if Turnstile siteverify fails", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_key";
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: false }),
      }) as any;
      const response = await request(app).post("/api/campaign/signal").send({
        productId: "prod-1",
        eventType: "view",
        cf_turnstile_response: "bad",
      });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Turnstile verification failed");
      delete process.env.TURNSTILE_SECRET_KEY;
    });

    it("returns 200 and records CTA click signal successfully when Turnstile passes", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_key";
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: true }),
      }) as any;
      const response = await request(app).post("/api/campaign/signal").send({
        productId: "prod-1",
        eventType: "cta_click",
        cf_turnstile_response: "good",
      });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      delete process.env.TURNSTILE_SECRET_KEY;
    });

    it("returns 200 and records signal successfully", async () => {
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "view" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("returns 200 and acts as a silent honeypot if website_url is provided", async () => {
      const response = await request(app).post("/api/campaign/signal").send({
        productId: "prod-1",
        eventType: "view",
        website_url: "http://spam.com",
      });

      if (response.status !== 200) console.log(response.body);
      expect(response.status).toBe(200);
    });

    it("returns 400 if payload is invalid", async () => {
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "", eventType: "invalid_type" });

      expect(response.status).toBe(400);
    });

    it("returns 413 if payload is too large", async () => {
      const hugeString = "a".repeat(10000); // > 5kb
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "view", extra: hugeString });

      expect(response.status).toBe(413);
    });

    it("returns 500 if signal ingestion fails", async () => {
      // Mock db.batch().commit() to throw an error
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error("Commit Failed")),
      };
      const firestoreInstanceMockTemp = {
        collection: vi.fn().mockReturnValue({ doc: vi.fn() }),
        batch: vi.fn(() => mockBatch),
      };

      const firestoreModule = await import("firebase-admin");
      vi.mocked(firestoreModule.firestore).mockReturnValueOnce(
        firestoreInstanceMockTemp as any,
      );

      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "view" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("POST /api/campaign/create-product", () => {
    it("returns 201 and creates product", async () => {
      const response = await request(app)
        .post("/api/campaign/create-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ name: "New Product" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });

    it("returns 400 if payload is invalid", async () => {
      const response = await request(app)
        .post("/api/campaign/create-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ name: "" }); // Empty name

      expect(response.status).toBe(400);
    });

    it("returns 500 if create product fails", async () => {
      const mockDoc = {
        id: "mock-doc-id",
        set: vi.fn().mockRejectedValue(new Error("Set Failed")),
      };
      const firestoreInstanceMockTemp = {
        collection: vi.fn().mockReturnValue({ doc: vi.fn(() => mockDoc) }),
      };

      const firestoreModule = await import("firebase-admin");
      vi.mocked(firestoreModule.firestore).mockReturnValueOnce(
        firestoreInstanceMockTemp as any,
      );

      const response = await request(app)
        .post("/api/campaign/create-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ name: "New Product" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("POST /api/campaign/fork-product", () => {
    it("returns 201 and forks product", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockImplementation((query) => {
            // Mock get for parent product doc vs activeVariantsQuery
            if (query.where) {
              return { size: 1, docs: [] };
            }
            return {
              exists: true,
              data: () => ({
                userId: "test-uid",
                rootId: "root-1",
                ancestors: [],
              }),
            };
          }),
          set: vi.fn(),
          update: vi.fn(),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/fork-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          parentId: "prod-1",
          name: "Forked Product",
          forkReason: "Testing",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("returns 400 if payload is invalid", async () => {
      const response = await request(app)
        .post("/api/campaign/fork-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ parentId: "", name: "", forkReason: "" });

      expect(response.status).toBe(400);
    });

    it("returns 500 if parent product does not exist", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockResolvedValue({ exists: false }),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/fork-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          parentId: "prod-1",
          name: "Forked Product",
          forkReason: "Testing",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Parent product does not exist.");
    });

    it("returns 500 if unauthorized to fork product", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ userId: "different-uid" }),
          }),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/fork-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          parentId: "prod-1",
          name: "Forked Product",
          forkReason: "Testing",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Unauthorized to fork this product.");
    });

    it("returns 403 if max 3 active variants exceeded", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockImplementation((query) => {
            if (query.where) {
              return { size: 3, docs: [] };
            }
            return {
              exists: true,
              data: () => ({
                userId: "test-uid",
                rootId: "root-1",
                ancestors: [],
              }),
            };
          }),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/fork-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          parentId: "prod-1",
          name: "Forked Product",
          forkReason: "Testing",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "Maximum of 3 active variants allowed per product root.",
      );
    });

    it("returns 500 if internal server error in fork product", async () => {
      const firestoreInstanceMockTemp = {
        collection: vi.fn().mockImplementation(() => {
          throw new Error("Internal Error");
        }),
      };

      const firestoreModule = await import("firebase-admin");
      vi.mocked(firestoreModule.firestore).mockReturnValueOnce(
        firestoreInstanceMockTemp as any,
      );

      const response = await request(app)
        .post("/api/campaign/fork-product")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          parentId: "prod-1",
          name: "Forked Product",
          forkReason: "Testing",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal Error");
    });
  });

  describe("POST /api/campaign/double-down", () => {
    it("returns 202 and processes double down", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockImplementation((query) => {
            if (query.where) {
              return { size: 1, docs: [{ id: "prod-2", ref: "ref-2" }] };
            }
            return {
              exists: true,
              data: () => ({
                userId: "test-uid",
                rootId: "root-1",
                status: "draft",
              }),
            };
          }),
          set: vi.fn(),
          update: vi.fn(),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/double-down")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ productId: "prod-1" });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
    });

    it("returns 400 if missing productId", async () => {
      const response = await request(app)
        .post("/api/campaign/double-down")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({});

      expect(response.status).toBe(400);
    });

    it("returns 500 if product does not exist", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockResolvedValue({ exists: false }),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/double-down")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ productId: "prod-1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Product does not exist.");
    });

    it("returns 403 if unauthorized", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ userId: "different-uid" }),
          }),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/double-down")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ productId: "prod-1" });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Unauthorized.");
    });

    it("returns 500 if already doubled down on", async () => {
      const db = admin.firestore();
      vi.mocked(db.runTransaction).mockImplementationOnce(async (cb: any) => {
        const mockTransaction = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ userId: "test-uid", status: "winner" }),
          }),
        };
        await cb(mockTransaction);
      });

      const response = await request(app)
        .post("/api/campaign/double-down")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ productId: "prod-1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Already doubled down on this product.");
    });

    it("returns 500 if internal server error in double down", async () => {
      const firestoreInstanceMockTemp = {
        collection: vi.fn().mockImplementation(() => {
          throw new Error("Internal Error");
        }),
      };

      const firestoreModule = await import("firebase-admin");
      vi.mocked(firestoreModule.firestore).mockReturnValueOnce(
        firestoreInstanceMockTemp as any,
      );

      const response = await request(app)
        .post("/api/campaign/double-down")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ productId: "prod-1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal Error");
    });
  });

  describe("POST /api/campaign/evaluate-taxonomy", () => {
    it("returns 400 if missing parameters", async () => {
      const response = await request(app)
        .post("/api/campaign/evaluate-taxonomy")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({});

      expect(response.status).toBe(400);
    });

    it("returns 202 and starts evaluation", async () => {
      const response = await request(app)
        .post("/api/campaign/evaluate-taxonomy")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          featuresToMerge: ["Feature A", "Feature B"],
          customName: "Merged",
          workspaceId: "ws-1",
        });

      expect(response.status).toBe(202);

      // Await pending background promises
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  describe("runTaxonomyEvaluation", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    it("uses fallback LLM validation if similarity is between thresholds", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock
        .mockResolvedValueOnce({
          embeddings: [{ values: new Array(768).fill(0).fill(1, 0, 1) }],
        })
        .mockResolvedValueOnce({
          embeddings: [
            {
              values: new Array(768)
                .fill(0)
                .fill(0.75, 0, 1)
                .fill(0.6614, 1, 2),
            },
          ],
        });
      (genai as any).__generateContentMock.mockResolvedValueOnce({
        text: "OBJECTIVE_SYNONYM",
      });

      const admin = await import("firebase-admin");
      const mockSet = vi.fn().mockResolvedValue(true);
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      const originalFirestore = admin.firestore;
      vi.mocked(admin.firestore).mockReturnValue({
        collection: mockCollection,
        doc: mockDoc,
        runTransaction: vi.fn(),
      } as any);
      (admin.firestore as any).FieldValue = (
        originalFirestore as any
      ).FieldValue;

      await expect(
        runTaxonomyEvaluation("user-1", ["F1", "F2"], "ws-1", "F3"),
      ).resolves.toBeUndefined();

      expect((genai as any).__generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining(
            "Determine the relationship between these two features",
          ),
        }),
      );
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ llmValidated: true }),
      );
      vi.mocked(admin.firestore).mockRestore();
    });

    it("sets relationship to SUBJECTIVE_GROUPING if similarity is below subjective threshold", async () => {
      const genai = await import("@google/genai");
      // Set embeddings to produce a similarity < 0.6
      (genai as any).__embedContentMock
        .mockResolvedValueOnce({
          embeddings: [{ values: new Array(768).fill(0).fill(1, 0, 1) }], // [1, 0, 0, ...]
        })
        .mockResolvedValueOnce({
          // Cosine similarity between [1, 0, 0, ...] and [0.5, 0.866, 0, ...] is 0.5 (which is < 0.6)
          embeddings: [
            {
              values: new Array(768)
                .fill(0)
                .fill(0.5, 0, 1)
                .fill(0.866025, 1, 2),
            },
          ],
        });

      const admin = await import("firebase-admin");
      const mockSet = vi.fn().mockResolvedValue(true);
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });
      vi.mocked(admin.firestore).mockReturnValue({
        collection: mockCollection,
        doc: mockDoc,
        runTransaction: vi.fn(),
      } as any);

      const { runTaxonomyEvaluation } =
        await import("../../server/campaignRoutes");
      await expect(
        runTaxonomyEvaluation("user-1", ["F1", "F2"], "ws-1", "Merged Name"),
      ).resolves.toBeUndefined();

      // Because it's SUBJECTIVE_GROUPING, the proposal should NOT be created, and taxRef set to idle
      expect(mockSet).not.toHaveBeenCalledWith(
        expect.objectContaining({ llmValidated: true }),
      );
      expect(mockSet).toHaveBeenCalledWith(
        { evaluationStatus: "idle" },
        { merge: true },
      );
      vi.mocked(admin.firestore).mockRestore();
    });

    it("falls back to DISTINCT if LLM response is unknown", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock
        .mockResolvedValueOnce({
          embeddings: [{ values: new Array(768).fill(0).fill(1, 0, 1) }],
        })
        .mockResolvedValueOnce({
          embeddings: [
            {
              values: new Array(768)
                .fill(0)
                .fill(0.75, 0, 1)
                .fill(0.6614, 1, 2),
            },
          ],
        });
      (genai as any).__generateContentMock.mockResolvedValueOnce({
        text: "SOME_JUNK",
      });

      const admin = await import("firebase-admin");
      const mockSet = vi.fn().mockResolvedValue(true);
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      const originalFirestore = admin.firestore;
      vi.mocked(admin.firestore).mockReturnValue({
        collection: mockCollection,
        doc: mockDoc,
        runTransaction: vi.fn(),
      } as any);
      (admin.firestore as any).FieldValue = (
        originalFirestore as any
      ).FieldValue;

      await expect(
        runTaxonomyEvaluation("user-1", ["F1", "F2"], "ws-1", "F3"),
      ).resolves.toBeUndefined();

      expect(mockSet).not.toHaveBeenCalledWith(
        expect.objectContaining({ llmValidated: true }),
      );
      expect(mockSet).toHaveBeenCalledWith(
        { evaluationStatus: "idle" },
        { merge: true },
      );
      vi.mocked(admin.firestore).mockRestore();
    });

    it("handles errors and updates taxonomy evaluationStatus to failed", async () => {
      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockRejectedValueOnce(
        new Error("Evaluation Failure"),
      );

      const admin = await import("firebase-admin");
      const mockSet = vi.fn().mockResolvedValue(true);
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      const originalFirestore = admin.firestore;
      vi.mocked(admin.firestore).mockReturnValue({
        collection: mockCollection,
        doc: mockDoc,
        runTransaction: vi.fn(),
      } as any);
      (admin.firestore as any).FieldValue = (
        originalFirestore as any
      ).FieldValue;

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        runTaxonomyEvaluation("user-1", ["F1", "F2"], "ws-1", "F3"),
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Taxonomy evaluation failed",
        expect.any(Error),
      );
      expect(mockSet).toHaveBeenCalledWith(
        { evaluationStatus: "failed" },
        { merge: true },
      );
      consoleErrorSpy.mockRestore();
      vi.mocked(admin.firestore).mockRestore();
    });
  });

  describe("POST /evaluate-taxonomy", () => {
    it("returns 401 if unauthorized", async () => {
      const response = await request(app).post(
        "/api/campaign/evaluate-taxonomy",
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 if missing payload", async () => {
      const response = await request(app)
        .post("/api/campaign/evaluate-taxonomy")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing parameters");
    });

    it("returns 202 and processes async if payload is valid", async () => {
      const admin = await import("firebase-admin");
      const mockSet = vi.fn().mockResolvedValue(true);
      const mockUpdate = vi.fn().mockResolvedValue(true);

      const firestoreMock = {
        collection: vi
          .fn()
          .mockReturnValue({ doc: vi.fn().mockReturnValue({ set: mockSet }) }),
        doc: vi.fn().mockReturnValue({ set: mockSet, update: mockUpdate }),
        runTransaction: vi.fn(async (cb) => {
          await cb({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ evaluationStatus: "evaluating" }),
            }),
            update: mockUpdate,
            set: mockSet,
          } as any);
        }),
      } as any;
      vi.mocked(admin.firestore).mockReturnValue(firestoreMock);

      const genai = await import("@google/genai");
      (genai as any).__embedContentMock.mockResolvedValue({
        embeddings: [{ values: new Array(768).fill(0).fill(1, 0, 1) }],
      });
      (genai as any).__generateContentMock.mockResolvedValue({
        text: '{"classification": "OBJECTIVE_SYNONYM", "confidence": 0.9}',
      });

      const response = await request(app)
        .post("/api/campaign/evaluate-taxonomy")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          featuresToMerge: ["F1", "F2"],
          customName: "Merged",
          workspaceId: "ws-1",
        });

      expect(response.status).toBe(202);

      await new Promise((resolve) => setTimeout(resolve, 50));
      vi.mocked(admin.firestore).mockRestore();
    });

    it("covers missing lines: API missing key error", async () => {
      const prevKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response1 = await request(app)
        .post("/api/campaign/evaluate-taxonomy")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({
          featuresToMerge: ["F1", "F2"],
          customName: "Merged",
          workspaceId: "ws-1",
        });

      expect(response1.status).toBe(202);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Taxonomy evaluation failed",
        expect.any(Error),
      );

      process.env.GEMINI_API_KEY = prevKey;
      consoleErrorSpy.mockRestore();
    });

    it("triggers line 254-258 in campaignRoutes.ts (ai.models is undefined)", async () => {
      process.env.GEMINI_API_KEY = "dummy-key";
      const genai = await import("@google/genai");
      const originalGoogleGenAI = genai.GoogleGenAI;

      const mockModels = undefined;
      (genai as any).GoogleGenAI = vi.fn().mockImplementation(() => ({
        models: mockModels,
      }));

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { runDeepValidationCampaign } =
        await import("../../server/campaignRoutes");

      await expect(
        runDeepValidationCampaign("job-id", "user", [{ name: "test" }], "base"),
      ).rejects.toThrow();

      (genai as any).GoogleGenAI = originalGoogleGenAI;
      consoleErrorSpy.mockRestore();
    });
  });
});
