// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

import { server } from "../../src/test-utils/server";
import { http, HttpResponse, passthrough } from "msw";

// Ensure NODE_ENV is test
process.env.NODE_ENV = "test";

// Mock auth middleware to let all requests through for backend testing
vi.mock("../../src/server/authMiddleware", () => ({
  /**
   *
   */
  requireAuth: (req: any, res: any, next: any) => next(),
}));

// Import appPromise AFTER mocking
import { appPromise } from "../../server";

describe("Backend API Integration Tests", () => {
  let app: express.Express;

  beforeEach(async () => {
    server.resetHandlers();

    // Bypass backend endpoints so supertest can hit Express
    server.use(
      http.post("*/api/apollo/enrich", () => passthrough()),
      http.post("*/api/apollo/news", () => passthrough()),
      http.get("*/api/health", () => passthrough()),
    );

    vi.clearAllMocks();
    process.env.APOLLO_API_KEY = "test-key";
    app = await appPromise;
  });

  it("GET /api/health should return ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  describe("POST /api/apollo/enrich", () => {
    it("should return 400 if domain is missing", async () => {
      const res = await request(app).post("/api/apollo/enrich").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Domain is required");
    });

    it("should return enriched data on successful Apollo response and forward rate limits", async () => {
      let interceptedApiKey = "";
      server.use(
        http.get(
          "https://api.apollo.io/v1/organizations/enrich",
          ({ request }) => {
            interceptedApiKey = request.headers.get("x-api-key") || "";
            return HttpResponse.json(
              {
                organization: { name: "Apollo.io" },
              },
              {
                headers: {
                  "x-rate-limit-limit": "100",
                  "x-rate-limit-remaining": "99",
                },
              },
            );
          },
        ),
      );

      const res = await request(app)
        .post("/api/apollo/enrich")
        .send({ domain: "apollo.io" });

      expect(res.status).toBe(200);
      expect(res.body.organization.name).toBe("Apollo.io");
      expect(res.headers["x-rate-limit-limit"]).toBe("100");
      expect(res.headers["x-rate-limit-remaining"]).toBe("99");
      expect(interceptedApiKey).toBe("test-key");
    });

    it("should override API key with x-api-key header from client", async () => {
      let interceptedApiKey = "";
      server.use(
        http.get(
          "https://api.apollo.io/v1/organizations/enrich",
          ({ request }) => {
            interceptedApiKey = request.headers.get("x-api-key") || "";
            return HttpResponse.json({});
          },
        ),
      );

      const res = await request(app)
        .post("/api/apollo/enrich")
        .set("x-api-key", "client-custom-key")
        .send({ domain: "custom.io" });

      expect(res.status).toBe(200);
      expect(interceptedApiKey).toBe("client-custom-key");
    });

    it("should handle Apollo errors", async () => {
      server.use(
        http.get("https://api.apollo.io/v1/organizations/enrich", () => {
          return new HttpResponse("Unauthorized", { status: 401 });
        }),
      );

      const res = await request(app)
        .post("/api/apollo/enrich")
        .send({ domain: "apollo.io" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Apollo API error: 401 Unauthorized/);
    });
  });

  describe("POST /api/apollo/news", () => {
    it("should return 400 if organization_ids are missing", async () => {
      const res = await request(app).post("/api/apollo/news").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("organization_ids is required");
    });

    it("should return news data on successful Apollo response and handle overrides", async () => {
      let interceptedApiKey = "";
      server.use(
        http.post(
          "https://api.apollo.io/v1/news_articles/search",
          ({ request }) => {
            interceptedApiKey = request.headers.get("x-api-key") || "";
            return HttpResponse.json(
              {
                news_articles: [{ title: "News 1" }],
              },
              {
                headers: {
                  "x-rate-limit-limit": "50",
                },
              },
            );
          },
        ),
      );

      const res = await request(app)
        .post("/api/apollo/news")
        .set("x-api-key", "client-news-key")
        .send({ organization_ids: ["org123"] });

      expect(res.status).toBe(200);
      expect(res.body.news_articles[0].title).toBe("News 1");
      expect(res.headers["x-rate-limit-limit"]).toBe("50");
      expect(interceptedApiKey).toBe("client-news-key");
    });
  });
});
