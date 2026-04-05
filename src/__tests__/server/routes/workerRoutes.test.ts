import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock internal auth
vi.mock("../../../server/internalAuthMiddleware", () => ({
  requireInternalOidc: (req: any, res: any, next: any) => next(),
}));

// Mock sse
vi.mock("../../../server/sse", () => ({
  publishSseEvent: vi.fn(),
}));

// Mock campaignRoutes
vi.mock("../../../server/campaignRoutes", () => ({
  runDeepValidationCampaign: vi.fn().mockResolvedValue(true),
}));

// Mock workers
vi.mock("../../../server/workers/marketIntelligenceWorker", () => ({
  processMarketIntelligenceJob: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../server/workers/brandWizardWorker", () => ({
  processBrandWizardJob: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../server/workers/brandTokenReviewWorker", () => ({
  processBrandTokenReviewJob: vi.fn().mockResolvedValue(true),
}));

// Mock hashing/supabase
vi.mock("../../../utils/hashing", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ id: "123", blob_uri: "uri", extracted_metadata: {} }],
        error: null,
      }),
    })),
  },
}));

// Mock exa
vi.mock("exa-js", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      search: vi.fn().mockResolvedValue({
        results: [{ text: "Exa result text" }],
      }),
    })),
  };
});

// Mock genai
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({ features: ["f1", "f2"] }),
        }),
        embedContent: vi.fn().mockResolvedValue({
          embeddings: [{ values: new Array(768).fill(0.1) }],
        }),
      },
    })),
  };
});

// Mock firebase-admin
vi.mock("firebase-admin", () => {
  const getMock = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ last_processed_id: "000" }),
  });
  const setMock = vi.fn().mockResolvedValue(true);
  const updateMock = vi.fn().mockResolvedValue(true);
  const deleteMock = vi.fn().mockResolvedValue(true);

  const docMock = vi.fn(() => ({
    get: getMock,
    set: setMock,
    update: updateMock,
    delete: deleteMock,
  }));

  const firestoreInstanceMock = {
    collection: vi.fn(() => ({
      doc: docMock,
    })),
  };

  const firestoreMock = vi.fn(() => firestoreInstanceMock) as any;
  firestoreMock.FieldValue = {
    serverTimestamp: vi.fn(() => "TIMESTAMP"),
  };

  return {
    default: {
      firestore: firestoreMock,
    },
    firestore: firestoreMock,
  };
});

import { workerRouter } from "../../../server/routes/workerRoutes";
import { publishSseEvent } from "../../../server/sse";
vi.mock("../../../server/workers/validationCampaignWorker", () => ({
  runDeepValidationCampaign: vi.fn().mockResolvedValue(true),
}));
import { runDeepValidationCampaign } from "../../../server/workers/validationCampaignWorker";
import * as miWorker from "../../../server/workers/marketIntelligenceWorker";
import * as bwWorker from "../../../server/workers/brandWizardWorker";
import * as btWorker from "../../../server/workers/brandTokenReviewWorker";

const app = express();
app.use(express.json());
app.use("/api/internal/worker", workerRouter);

describe("workerRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /run-validation-campaign", () => {
    it("runs validation campaign", async () => {
      const response = await request(app)
        .post("/api/internal/worker/run-validation-campaign")
        .send({
          jobId: "job-1",
          userId: "u1",
          competitors: [],
          baseIdea: "idea",
        });

      expect(response.status).toBe(200);
      expect(runDeepValidationCampaign).toHaveBeenCalledWith(
        "job-1",
        "u1",
        [],
        "idea",
      );
    });
  });

  describe("POST /network-io", () => {
    it("processes standard network-io job via Exa", async () => {
      process.env.EXA_API_KEY = "test-key";
      const response = await request(app)
        .post("/api/internal/worker/network-io")
        .send({ jobId: "job-3", url: "https://example.com" });

      expect(response.status).toBe(200);
      expect(response.body.text).toBe("Exa result text");
      expect(publishSseEvent).toHaveBeenCalledWith(
        "job-3",
        "completed",
        expect.any(Object),
      );
    });

    it("handles missing EXA_API_KEY", async () => {
      delete process.env.EXA_API_KEY;
      const response = await request(app)
        .post("/api/internal/worker/network-io")
        .send({ jobId: "job-4", url: "https://example.com" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("EXA_API_KEY is missing");
      expect(publishSseEvent).toHaveBeenCalledWith("job-4", "failed", {
        error: "EXA_API_KEY is missing",
      });
    });
  });

  describe("POST /vision-ml", () => {
    it("processes image and returns features", async () => {
      process.env.GEMINI_API_KEY = "test-key";
      const response = await request(app)
        .post("/api/internal/worker/vision-ml")
        .send({
          jobId: "job-5",
          imageBase64: "data:image/png;base64,abc",
          mimeType: "image/png",
        });

      expect(response.status).toBe(200);
      expect(response.body.features).toEqual(["f1", "f2"]);
      expect(publishSseEvent).toHaveBeenCalledWith(
        "job-5",
        "completed",
        expect.any(Object),
      );
    });

    it("fetches heavy payload if isHeavyPayload is true", async () => {
      process.env.GEMINI_API_KEY = "test-key";
      const response = await request(app)
        .post("/api/internal/worker/vision-ml")
        .send({ jobId: "job-6", isHeavyPayload: true, imageBase64: "abc" });

      expect(response.status).toBe(200);
    });

    it("handles missing GEMINI_API_KEY", async () => {
      delete process.env.GEMINI_API_KEY;
      const response = await request(app)
        .post("/api/internal/worker/vision-ml")
        .send({ jobId: "job-7", imageBase64: "abc" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("GEMINI_API_KEY is missing");
    });
  });

  describe("POST /market-intelligence", () => {
    it("processes market intelligence job", async () => {
      const response = await request(app)
        .post("/api/internal/worker/market-intelligence")
        .send({ jobId: "job-mi" });

      expect(response.status).toBe(200);
      expect(miWorker.processMarketIntelligenceJob).toHaveBeenCalled();
    });

    it("handles worker failure", async () => {
      vi.mocked(miWorker.processMarketIntelligenceJob).mockRejectedValueOnce(
        new Error("MI Error"),
      );
      const response = await request(app)
        .post("/api/internal/worker/market-intelligence")
        .send({ jobId: "job-mi" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("MI Error");
    });
  });

  describe("POST /brand-wizard", () => {
    it("processes brand wizard job", async () => {
      const response = await request(app)
        .post("/api/internal/worker/brand-wizard")
        .send({ jobId: "job-bw" });

      expect(response.status).toBe(200);
      expect(bwWorker.processBrandWizardJob).toHaveBeenCalled();
    });

    it("handles worker failure", async () => {
      vi.mocked(bwWorker.processBrandWizardJob).mockRejectedValueOnce(
        new Error("BW Error"),
      );
      const response = await request(app)
        .post("/api/internal/worker/brand-wizard")
        .send({ jobId: "job-bw" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("BW Error");
    });
  });

  describe("POST /brand-review", () => {
    it("processes brand review job", async () => {
      const response = await request(app)
        .post("/api/internal/worker/brand-review")
        .send({ jobId: "job-br" });

      expect(response.status).toBe(200);
      expect(btWorker.processBrandTokenReviewJob).toHaveBeenCalled();
    });

    it("handles worker failure", async () => {
      vi.mocked(btWorker.processBrandTokenReviewJob).mockRejectedValueOnce(
        new Error("BR Error"),
      );
      const response = await request(app)
        .post("/api/internal/worker/brand-review")
        .send({ jobId: "job-br" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("BR Error");
    });
  });

  describe("POST /distillation", () => {
    it("processes distillation job with records", async () => {
      const response = await request(app)
        .post("/api/internal/worker/distillation")
        .send({ jobId: "job-dist1" });

      expect(response.status).toBe(200);
      expect(response.body.recordsProcessed).toBe(1);
      expect(response.body.newWatermark).toBe("123");
    });

    it("processes distillation job with no records", async () => {
      const { supabase } = await import("../../../utils/hashing");
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const response = await request(app)
        .post("/api/internal/worker/distillation")
        .send({ jobId: "job-dist2" });

      expect(response.status).toBe(200);
      expect(response.body.recordsProcessed).toBe(0);
    });

    it("handles supabase error", async () => {
      const { supabase } = await import("../../../utils/hashing");
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("DB Error"),
        }),
      } as any);

      const response = await request(app)
        .post("/api/internal/worker/distillation")
        .send({ jobId: "job-dist3" });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "Failed to fetch records for distillation",
      );
    });
  });
});
