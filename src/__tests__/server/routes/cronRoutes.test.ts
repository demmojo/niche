import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock internal auth middleware
vi.mock("../../../server/internalAuthMiddleware", () => ({
  requireInternalOidc: (req: any, res: any, next: any) => next(),
}));

// Mock services
import { runTarpitClustering } from "../../../services/tarpitFlywheel";
import { processTaxonomyOutboxJobs } from "../../../server/workers/taxonomyPiscinaWorker";

vi.mock("../../../services/tarpitFlywheel", () => ({
  runTarpitClustering: vi.fn(),
}));

vi.mock("../../../server/workers/taxonomyPiscinaWorker", () => ({
  processTaxonomyOutboxJobs: vi.fn(),
}));

import { cronRouter } from "../../../server/routes/cronRoutes";

const app = express();
app.use(express.json());
app.use("/cron", cronRouter);

describe("cronRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /cron/tarpit-clustering", () => {
    it("should return 200 on success", async () => {
      vi.mocked(runTarpitClustering).mockResolvedValueOnce(undefined);
      const res = await request(app).post("/cron/tarpit-clustering");
      expect(res.status).toBe(200);
      expect(runTarpitClustering).toHaveBeenCalledTimes(1);
    });

    it("should return 500 on error", async () => {
      vi.mocked(runTarpitClustering).mockRejectedValueOnce(
        new Error("Clustering failed"),
      );
      const res = await request(app).post("/cron/tarpit-clustering");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Clustering failed" });
    });
  });

  describe("POST /cron/taxonomy-merge", () => {
    it("should return 200 on success", async () => {
      vi.mocked(processTaxonomyOutboxJobs).mockResolvedValueOnce(undefined);
      const res = await request(app).post("/cron/taxonomy-merge");
      expect(res.status).toBe(200);
      expect(processTaxonomyOutboxJobs).toHaveBeenCalledTimes(1);
    });

    it("should return 500 on error", async () => {
      vi.mocked(processTaxonomyOutboxJobs).mockRejectedValueOnce(
        new Error("Merge failed"),
      );
      const res = await request(app).post("/cron/taxonomy-merge");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Merge failed" });
    });
  });
});
