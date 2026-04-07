// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGeminiKeys,
  addGeminiKey,
  removeGeminiKey,
  getSelectedModel,
  setSelectedModel,
  getGeminiClient,
  rotateGeminiKey,
  withKeyRotation,
} from "../../utils/geminiClient";
import * as apiKeys from "../../utils/apiKeys";
import { GoogleGenAI } from "@google/genai";

vi.mock("../../utils/apiKeys", () => ({
  getCustomApiKey: vi.fn(),
}));

vi.mock("../../utils/usageTracker", () => ({
  trackRequest: vi.fn(),
}));

describe("geminiClient", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getGeminiKeys", () => {
    it("returns empty array when no keys exist", () => {
      delete process.env.GEMINI_API_KEY;
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue(null);
      expect(getGeminiKeys()).toEqual([]);
    });

    it("returns custom key if set", () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("custom-key");
      expect(getGeminiKeys()).toEqual(["custom-key"]);
    });

    it("returns env key if custom key is not set", () => {
      process.env.GEMINI_API_KEY = "env-key";
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue(null);
      expect(getGeminiKeys()).toEqual(["env-key"]);
    });
  });

  describe("add/remove keys (no-ops)", () => {
    it("does not crash", () => {
      expect(() => addGeminiKey("test")).not.toThrow();
      expect(() => removeGeminiKey("test")).not.toThrow();
    });
  });

  describe("model selection", () => {
    it("gets default model", () => {
      expect(getSelectedModel()).toBe("gemini-3.1-flash");
    });

    it("sets and gets selected model", () => {
      setSelectedModel("custom-model-123");
      expect(getSelectedModel()).toBe("custom-model-123");
    });
  });

  describe("getGeminiClient", () => {
    it("throws error if no key is available", () => {
      delete process.env.GEMINI_API_KEY;
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue(null);
      expect(() => getGeminiClient()).toThrow(/No Gemini API key/);
    });

    it("returns client initialized with key", () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("mock-api-key");
      const client = getGeminiClient();
      expect(client).toBeInstanceOf(GoogleGenAI);
    });
  });

  describe("rotateGeminiKey", () => {
    it("returns false", () => {
      expect(rotateGeminiKey()).toBe(false);
    });
  });

  describe("withKeyRotation", () => {
    it("executes the operation and returns successful result from MSW", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("mock-api-key");
      const result = await withKeyRotation(async (ai, model) => {
        return ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: "Hello",
        });
      });
      expect(result.candidates?.[0]?.content?.parts?.[0]?.text).toBe(
        "gemini response",
      );
    });
  });

  describe("Bug Fixes: Phase 3 Domain B", () => {
    it("handles rate-limit (429) backoff correctly before escalating", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("mock-api-key");
      setSelectedModel("gemini-3.1-flash");
      let calls = 0;
      const mockOp = vi.fn().mockImplementation(async () => {
        calls++;
        if (calls === 1) {
          const err = new Error("Rate limit exceeded");
          (err as any).status = 429;
          throw err;
        }
        return "success";
      });

      const startTime = Date.now();
      const result = await withKeyRotation(mockOp);
      const endTime = Date.now();

      expect(result).toBe("success");
      expect(mockOp).toHaveBeenCalledTimes(2);
      expect(mockOp).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        "gemini-3.1-flash",
        expect.anything(),
      );
      expect(mockOp).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        "gemini-3.1-flash",
        expect.anything(),
      );
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    it("passes AbortSignal to operation to prevent unbounded timeouts", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("mock-api-key");
      let receivedSignal: AbortSignal | undefined;
      const mockOp = vi.fn().mockImplementation(async (ai, model, signal) => {
        receivedSignal = signal;
        await new Promise((r) => setTimeout(r, 100));
        return "slow result";
      });

      try {
        await withKeyRotation(mockOp, 50);
      } catch (e) {
        // ignore
      }

      expect(receivedSignal).toBeDefined();
      expect(receivedSignal?.aborted).toBe(true);
    });
  });
});
