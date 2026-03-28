import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchAvailableModels,
  getMainModel,
  setMainModel,
  withModelFallback,
} from "../../utils/aiClient";
import * as apiKeys from "../../utils/apiKeys";

vi.mock("../../utils/usageTracker", () => ({
  trackRequest: vi.fn(),
}));

// --- Tests ---
describe("aiClient utils", () => {
  let mockKeys: Record<string, string | null> = {};

  beforeEach(() => {
    localStorage.clear();
    mockKeys = {};
    vi.spyOn(apiKeys, "getCustomApiKey").mockImplementation(
      (provider: string) => mockKeys[provider] || null,
    );

    // Reset env keys
    delete process.env.GEMINI_API_KEY;

    vi.clearAllMocks();
  });

  describe("getMainModel / setMainModel", () => {
    it("returns default auto model when local storage is empty", () => {
      expect(getMainModel()).toEqual("default-pro");
    });

    it("returns auto when local storage has invalid old data", () => {
      localStorage.setItem("ai_selected_models", "{ invalid json ]");
      expect(getMainModel()).toEqual("default-pro");
    });

    it("setMainModel and getMainModel work together", () => {
      setMainModel("gemini-3.1-pro-preview");
      expect(getMainModel()).toEqual("gemini-3.1-pro-preview");
    });
  });

  describe("fetchAvailableModels", () => {
    it("returns static list of models", async () => {
      const models = await fetchAvailableModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.provider === "gemini")).toBe(true);
      expect(models.some((m) => m.provider === "openai")).toBe(true);
      expect(models.some((m) => m.provider === "anthropic")).toBe(true);
    });
  });

  describe("withModelFallback & AIClient basics", () => {
    it("uses primary model if successful", async () => {
      mockKeys["openai"] = "test-key";
      setMainModel("gpt-4o");

      const mockOperation = vi.fn().mockResolvedValue("success");
      const result = await withModelFallback(mockOperation);

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith(
        expect.anything(),
        "gpt-4o",
        expect.anything(),
      );
    });

    it("falls back to second model if primary fails with rate limit error", async () => {
      mockKeys["openai"] = "test-key";
      mockKeys["anthropic"] = "test-key2";
      setMainModel("auto");

      const rateLimitError = new Error("429 Rate Limit Exceeded");
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce("success2");

      const result = await withModelFallback(mockOperation, {
        capability: "reasoning",
      });

      expect(result).toBe("success2");
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockOperation).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        "gemini-3.1-pro-preview",
        expect.anything(),
      );
      expect(mockOperation).toHaveBeenNthCalledWith(
        3,
        expect.anything(),
        "gpt-4o",
        expect.anything(),
      );
    });

    it("throws generic error when all models fail and last error is NOT a rate limit", async () => {
      mockKeys["openai"] = "test-key";
      setMainModel("auto");

      const genericError = new Error("Some random network error");
      const mockOperation = vi.fn().mockRejectedValue(genericError);

      await expect(withModelFallback(mockOperation)).rejects.toThrow(
        "All configured models failed",
      );
    });

    it("respects timeout logic and falls back", async () => {
      mockKeys["openai"] = "test-key";
      mockKeys["gemini"] = "test-key2";
      setMainModel("auto");

      const mockOperation = vi
        .fn()
        .mockImplementationOnce(async () => {
          await new Promise((r) => setTimeout(r, 100));
          return "slow result";
        })
        .mockResolvedValueOnce("fast fallback result");

      const result = await withModelFallback(
        mockOperation,
        { capability: "chat" },
        50,
      );

      expect(result).toBe("fast fallback result");
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe("AIClient.generateContent capabilities via MSW", () => {
    let aiClient: any;

    beforeEach(async () => {
      mockKeys["gemini"] = "test-key";
      setMainModel("gemini-3.1-pro-preview");
      await withModelFallback(async (ai) => {
        aiClient = ai;
        return true;
      });
    });

    it("calls /api/llm/generate and returns mocked result", async () => {
      const params = {
        contents: "hello",
      };
      const res = await aiClient.generateContent(
        "gemini-3.1-pro-preview",
        params,
      );

      expect(res).toBeDefined();
      expect(res.text).toContain("Mock generated market summary");
    });

    it("calls /api/llm/generate via generateContentStream and returns mocked stream", async () => {
      const res = await aiClient.generateContentStream(
        "gemini-3.1-pro-preview",
        { contents: "hello" },
      );

      const result = await res.next();
      expect(result.value.text).toContain("Mock generated market summary");
      expect(result.done).toBe(false);
    });
  });

  describe("Bug Fixes: Phase 3 Domain B", () => {
    let globalFetch: any;
    beforeEach(() => {
      globalFetch = global.fetch;
    });
    afterEach(() => {
      if (globalFetch) global.fetch = globalFetch;
    });

    it("handles rate-limit (429) backoff correctly before escalating", async () => {
      mockKeys["openai"] = "test-key";
      setMainModel("gemini-3.1-pro-preview");
      let calls = 0;
      const mockOperation = vi.fn().mockImplementation(async () => {
        calls++;
        if (calls === 1) {
          const err = new Error("Rate limit");
          (err as any).status = 429;
          throw err;
        }
        return "success-after-backoff";
      });

      const startTime = Date.now();
      const result = await withModelFallback(mockOperation, {
        capability: "reasoning",
      });
      const endTime = Date.now();

      expect(result).toBe("success-after-backoff");
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        "gemini-3.1-pro-preview",
        expect.anything(),
      );
      expect(mockOperation).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        "gemini-3.1-pro-preview",
        expect.anything(),
      );
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000); // Because exponential backoff delay is at least 1s
    });

    it("passes AbortSignal to operation to prevent unbounded timeouts", async () => {
      mockKeys["openai"] = "test-key";
      setMainModel("auto");
      let receivedSignal: AbortSignal | undefined;
      const mockOperation = vi
        .fn()
        .mockImplementation(async (ai, model, signal) => {
          receivedSignal = signal;
          await new Promise((r) => setTimeout(r, 100));
          return "slow result";
        });

      try {
        await withModelFallback(mockOperation, { capability: "chat" }, 50);
      } catch (e) {
        // ignore timeout error
      }

      expect(receivedSignal).toBeDefined();
      expect(receivedSignal?.aborted).toBe(true);
    });

    it("handles malformed JSON parsing panics gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        /**
         *
         */
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
        /**
         *
         */
        text: async () => "<html>Gateway Timeout</html>",
      });

      /**
       *
       */
      const mockOp = async (ai: any) =>
        ai.generateContent("gemini-3.1-pro-preview", { contents: "hello" });

      await expect(withModelFallback(mockOp)).rejects.toThrow(
        "All configured models failed",
      );
    });
  });
});
