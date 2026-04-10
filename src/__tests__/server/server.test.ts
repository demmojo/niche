import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { appPromise } from "../../../server";
import { supabase } from "../../../src/utils/hashing";
import { logger } from "../../../src/server/logger";

vi.mock("../../../src/utils/hashing", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [{ id: 1 }], error: null })),
      })),
    })),
  },
  calculateSimHash: vi.fn(),
  calculateExactHash: vi.fn(),
  simHashDistance: vi.fn(),
  generateEmbedding: vi.fn(),
}));

import { server } from "../../../src/test-utils/server";

describe("Server core endpoints", () => {
  let app: any;
  beforeAll(async () => {
    if (server) server.close();
    app = await appPromise;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Health Checks", () => {
    it("GET /livez should return 200 OK without hitting DB", async () => {
      const start = Date.now();
      const res = await request(app).get("/livez");
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.text).toBe("OK");
      expect(duration).toBeLessThan(50); // fast response
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("GET /healthz should return 200 OK without hitting DB", async () => {
      const res = await request(app).get("/healthz");
      expect(res.status).toBe(200);
      expect(res.text).toBe("OK");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("GET /readyz should return 200 OK if DB is healthy", async () => {
      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({ data: [{ id: 1 }], error: null }),
          ),
        })),
      }));

      const res = await request(app).get("/readyz");
      expect(res.status).toBe(200);
      expect(res.text).toBe("OK");
      expect(supabase.from).toHaveBeenCalledWith("raw_data_assets");
    });

    it("GET /readyz should return 503 if DB times out or errors", async () => {
      // Mock an error
      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({ data: null, error: new Error("DB down") }),
          ),
        })),
      }));

      const res = await request(app).get("/readyz");
      expect(res.status).toBe(503);
      expect(res.text).toBe("Unavailable");
    });
  });

  describe("Telemetry", () => {
    it("POST /api/telemetry/csp-report should parse application/csp-report and log it", async () => {
      const loggerSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      const payload = {
        "csp-report": {
          "document-uri": "http://example.com/signup",
          "violated-directive": "script-src 'self'",
        },
      };

      const res = await request(app)
        .post("/api/telemetry/csp-report")
        .set("Content-Type", "application/csp-report")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(loggerSpy).toHaveBeenCalledWith("CSP Violation:", payload);
    });

    it("POST /api/telemetry/csp-report should also handle application/json", async () => {
      const loggerSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      const payload = { test: 123 };

      const res = await request(app)
        .post("/api/telemetry/csp-report")
        .set("Content-Type", "application/json")
        .send(payload);

      expect(res.status).toBe(200);
      expect(loggerSpy).toHaveBeenCalledWith("CSP Violation:", payload);
    });
  });
});
