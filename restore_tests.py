import re

def insert_tests():
    with open("src/__tests__/server/campaignRoutes.test.ts", "r") as f:
        text = f.read()

    # setupTests.ts mock has no __generateContentMock, so we'll just rewrite the tests using vi.spyOn where possible, or just re-add the exports to setup mock!
    # Wait, the previous file HAD the setup mock! Did git checkout overwrite it? Yes!
    
    # 1. Update the setup mock at the top of the file
    setup_mock = """vi.mock("@google/genai", () => {
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
});"""
    text = re.sub(r'vi\.mock\("@google/genai", \(\) => \{[\s\S]*?\}\);', setup_mock, text)

    # 2. POST /start tests
    start_tests = """    it("logs critical error if refund fails", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(1);
      
      const admin = await import("firebase-admin");
      const db = admin.firestore();
      
      vi.spyOn(db, "runTransaction").mockImplementationOnce(async () => {});
      
      const docRefMock = {
        set: vi.fn().mockRejectedValue(new Error("Queue Error")),
      };
      vi.spyOn(db, "collection").mockReturnValueOnce({
        doc: vi.fn().mockReturnValue(docRefMock),
      } as any);

      vi.spyOn(db, "runTransaction").mockRejectedValueOnce(new Error("Refund Error"));
      
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ title: "Base Idea" });

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "CRITICAL: Failed to refund credit for failed campaign start. User: test-uid",
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it("returns 500 on unexpected error in POST /start (lines 221-223)", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockRejectedValueOnce(new Error("Unknown start error"));

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ title: "Base Idea" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal server error" });
    });

    it("returns 202 and creates a job if credits exist", async () => {"""
    text = text.replace('    it("returns 202 and creates a job if credits exist", async () => {', start_tests)

    # 3. POST /pivot tests
    pivot_tests = """    it("returns 200 if responseText is already an object (line 90)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: { pivot: "Object Pivot" } });

      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ competitors: [{ name: "comp1" }], baseIdea: {} });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ pivot: "Object Pivot" });
    });

    it("returns 500 if LLM extraction fails (lines 94-98)", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockRejectedValueOnce(new Error("LLM Error"));

      const response = await request(app)
        .post("/api/campaign/pivot")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ competitors: [{ name: "foo.com" }], baseIdea: {} });

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
        .send({ competitors: [{ name: "foo.com" }], baseIdea: {} });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to generate sub-niches");
    });

    it("deducts credit and returns mock pivot data", async () => {"""
    text = text.replace('    it("deducts credit and returns mock pivot data", async () => {', pivot_tests)

    # 4. runDeepValidationCampaign tests
    deep_tests = """  describe("runDeepValidationCampaign (Background worker)", () => {
    it("handles invalid embeddings properly (lines 267-268)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "{}" });
      (genai as any).__embedContentMock.mockResolvedValueOnce({ embeddings: [] });

      const competitors = [{ domain: "comp0.com" }];

      const { runDeepValidationCampaign } = await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-inv", "user", competitors, "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      const jobRef = db.collection("campaign_jobs").doc("job-inv");
      
      expect(jobRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", progress: 1 })
      );
    });

    it("handles extraction zod parse failure (lines 286-287)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "{}" });
      (genai as any).__embedContentMock.mockResolvedValueOnce({ embeddings: [{ values: new Array(768).fill(0.1) }] });

      const { LLMExtractionSchema } = await import("../../utils/scoringEngine");
      vi.spyOn(LLMExtractionSchema, "safeParse").mockReturnValueOnce({ success: false, error: new Error() } as any);

      const competitors = [{ domain: "compZod.com" }];

      const { runDeepValidationCampaign } = await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-zod", "user", competitors, "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(db.collection("campaign_jobs").doc("job-zod").update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });

    it("handles validateExaUrl failure (lines 290-293)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "{}" });
      (genai as any).__embedContentMock.mockResolvedValueOnce({ embeddings: [{ values: new Array(768).fill(0.1) }] });

      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(scoringEngine, "validateExaUrl").mockReturnValueOnce(false);

      const competitors = [{ domain: "compExa.com" }];

      const { runDeepValidationCampaign } = await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-exa", "user", competitors, "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(db.collection("campaign_jobs").doc("job-exa").update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });

    it("handles missing base idea embeddings (lines 383)", async () => {
      const mockEmbedContent = vi.fn().mockImplementation((args: any) => {
        if (args.contents === "base") {
          return Promise.resolve({ embeddings: [] }); // missing values
        }
        return Promise.resolve({ embeddings: [{ values: new Array(768).fill(0.1) }] });
      });

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "{}" });
      (genai as any).__embedContentMock.mockImplementationOnce(mockEmbedContent);

      const { runDeepValidationCampaign } = await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-miss", "user", [{ domain: "compMiss.com" }], "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(db.collection("campaign_jobs").doc("job-miss").update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });

    it("applies wedge override if isTarpit and maxWedge > 0.85 (lines 400-403)", async () => {
      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "{}" });
      (genai as any).__embedContentMock.mockResolvedValueOnce({ embeddings: [{ values: new Array(768).fill(0.1) }] });

      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(scoringEngine, "calculateOrthogonalDistance").mockReturnValue(0.9);
      vi.spyOn(scoringEngine, "calculateTarpitScore").mockReturnValue({
        status: "success",
        score: 85,
        isTarpit: true,
      });

      const { runDeepValidationCampaign } = await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-wedge", "user", [{ domain: "compWedge.com" }], "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(db.collection("campaign_jobs").doc("job-wedge").update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          scoreResult: expect.objectContaining({
            isTarpit: false,
            message: expect.stringMatching(/Wedge metric overrides Tarpit score/)
          })
        })
      );
    });

    it("returns 1.0 uniqueness if no enrichments succeed (line 383)", async () => {
      const mockEmbedContent = vi.fn().mockImplementation((args: any) => {
        if (args.contents === "base") {
          return Promise.resolve({ embeddings: [{ values: new Array(768).fill(0.1) }] });
        }
        return Promise.reject(new Error("Network Error"));
      });

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "{}" });
      (genai as any).__embedContentMock.mockImplementationOnce(mockEmbedContent);

      const { runDeepValidationCampaign } = await import("../../server/campaignRoutes");
      await runDeepValidationCampaign("job-none", "user", [{ domain: "compNone.com" }], "base");

      const admin = await import("firebase-admin");
      const db = admin.firestore();
      expect(db.collection("campaign_jobs").doc("job-none").update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });

    it("handles batching and resolves successfully (TC-BATCH-01)", async () => {"""
    text = text.replace('  describe("runDeepValidationCampaign (Background worker)", () => {\n    it("handles batching and resolves successfully (TC-BATCH-01)", async () => {', deep_tests)

    # Need to update the mock setup in batch-02 and wherever else
    chaos_test = """    it("handles chaos testing: artificially rejects 1 in 10 promises but completes (TC-BATCH-02)", async () => {
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
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: JSON.stringify({ subNiches: [{ name: "foo" }] }) });
      (genai as any).__embedContentMock.mockImplementationOnce(mockEmbedContent);

      const competitors = Array.from({ length: 10 }).map((_, i) => ({
        domain: `comp${i}.com`,
      }));"""
    text = re.sub(r'    it\("handles chaos testing: artificially rejects 1 in 10 promises but completes \(TC-BATCH-02\)", async \(\) => \{[\s\S]*?const competitors = Array.from\(\{ length: 10 \}\).map\(\(_, i\) => \(\{[\s\S]*?domain: `comp\$\{i\}.com`,[\s\S]*?\}\)\);', chaos_test, text)

    # 5. POST /signal tests
    signal_tests = """  describe("POST /api/campaign/signal", () => {
    it("returns 200 and acts as a honeypot if website_url is provided (lines 565-568)", async () => {
      const response = await request(app).post("/api/campaign/signal").send({
        productId: "prod-1",
        eventType: "view",
        website_url: "http://spam.com",
      });
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
        json: vi.fn().mockResolvedValue({ success: false })
      }) as any;
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "view", cf_turnstile_response: "bad" });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Turnstile verification failed");
      delete process.env.TURNSTILE_SECRET_KEY;
    });

    it("returns 200 and records CTA click signal successfully when Turnstile passes", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_key";
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: true })
      }) as any;
      const response = await request(app)
        .post("/api/campaign/signal")
        .send({ productId: "prod-1", eventType: "cta_click", cf_turnstile_response: "good" });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      delete process.env.TURNSTILE_SECRET_KEY;
    });

    it("returns 200 and records signal successfully", async () => {"""
    text = text.replace('  describe("POST /api/campaign/signal", () => {\n    it("returns 200 and records signal successfully", async () => {', signal_tests)

    # 6. runTaxonomyEvaluation tests
    tax_tests = """    it("handles fallback LLM validation with DISTINCT", async () => {
      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(scoringEngine, "calculateCosineSimilarity").mockReturnValueOnce(0.7);

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "DISTINCT" });

      const { runTaxonomyEvaluation } = await import("../../server/campaignRoutes");
      await expect(
        runTaxonomyEvaluation("user-1", ["featureA", "featureB"], "workspace-1", "mergedFeature")
      ).resolves.toBeUndefined();
    });

    it("handles SUBJECTIVE_GROUPING relation based on similarity threshold (line 472)", async () => {
      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(scoringEngine, "calculateCosineSimilarity").mockReturnValueOnce(0.5);

      const { runTaxonomyEvaluation } = await import("../../server/campaignRoutes");
      await expect(
        runTaxonomyEvaluation("user-1", ["featureA", "featureB"], "workspace-1", "mergedFeature")
      ).resolves.toBeUndefined();
    });

    it("handles fallback LLM returning unknown string defaulting to DISTINCT (line 486)", async () => {
      const scoringEngine = await import("../../utils/scoringEngine");
      vi.spyOn(scoringEngine, "calculateCosineSimilarity").mockReturnValueOnce(0.7);

      const genai = await import("@google/genai");
      (genai as any).__generateContentMock.mockResolvedValueOnce({ text: "UNKNOWN_TRASH" });

      const { runTaxonomyEvaluation } = await import("../../server/campaignRoutes");
      await expect(
        runTaxonomyEvaluation("user-1", ["featureA", "featureB"], "workspace-1", "mergedFeature")
      ).resolves.toBeUndefined();
    });

  describe("POST /api/campaign/create-product", () => {"""
    text = re.sub(r'    it\("handles fallback LLM validation with DISTINCT", async \(\) => \{[\s\S]*?\}\);\s+describe\("POST /api/campaign/create-product", \(\) => \{', tax_tests, text)

    # 7. Add exported function for Taxonomy if missing
    # Actually wait, my git checkout also reverted campaignRoutes.ts! No, git checkout only reverted the test file!
    # Because I only ran `git checkout src/__tests__/server/campaignRoutes.test.ts`.

    with open("src/__tests__/server/campaignRoutes.test.ts", "w") as f:
        f.write(text)

insert_tests()
