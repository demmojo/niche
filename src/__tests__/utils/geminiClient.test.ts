import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGeminiKeys,
  addGeminiKey,
  removeGeminiKey,
  getSelectedModel,
  setSelectedModel,
  getGeminiClient,
  rotateGeminiKey,
} from "../../utils/geminiClient";
import { withModelFallback } from "../../utils/aiClient";
import * as apiKeys from "../../utils/apiKeys";
import * as usageTracker from "../../utils/usageTracker";
import { GoogleGenAI } from "@google/genai";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation((config) => ({
    config,
    models: {
      generateContent: vi.fn(),
    },
  })),
}));

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
      expect(getSelectedModel()).toBe("gemini-3-flash-preview");
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
      expect(client).toBeDefined();
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "mock-api-key" });
    });
  });

  describe("rotateGeminiKey", () => {
    it("returns false", () => {
      expect(rotateGeminiKey()).toBe(false);
    });
  });

  describe("withModelFallback", () => {
    let consoleWarnSpy: any;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("throws error if no key is available", async () => {
      delete process.env.GEMINI_API_KEY;
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue(null);
      await expect(withModelFallback(async () => "test")).rejects.toThrow(
        /No Gemini API key/,
      );
    });

    it("executes operation successfully and tracks request", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");
      const op = vi.fn().mockResolvedValue("success-result");

      const result = await withModelFallback(op);

      expect(result).toBe("success-result");
      expect(op).toHaveBeenCalled();
      expect(usageTracker.trackRequest).toHaveBeenCalledWith(
        "gemini",
        "valid-key",
        false,
        "gemini-3-flash-preview",
      );
    });

    it("handles timeout correctly and retries with lite model", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");

      // First call times out (throws), second call succeeds
      const op = vi
        .fn()
        .mockRejectedValueOnce(new Error("timed out"))
        .mockResolvedValueOnce("success-after-retry");

      const result = await withModelFallback(op, { tier: "fast" }, 50);

      expect(result).toBe("success-after-retry");
      expect(op).toHaveBeenCalledTimes(2);
      expect(usageTracker.trackRequest).toHaveBeenCalledWith(
        "gemini",
        "valid-key",
        true,
        "gemini-3-flash-preview",
      );
      expect(usageTracker.trackRequest).toHaveBeenCalledWith(
        "gemini",
        "valid-key",
        false,
        "gemini-3.1-flash-lite-preview",
      );
    });

    it("falls back to lite model on rate limit", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");

      const rateLimitError = new Error("429 Too Many Requests");
      const op = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce("success");

      const result = await withModelFallback(op);

      expect(result).toBe("success");
      expect(op).toHaveBeenCalledTimes(2);
    });

    it("falls back on 404 error to basic flash preview", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");
      setSelectedModel("some-unknown-model");

      const notFoundError = new Error("NOT_FOUND: Model not found");
      const op = vi
        .fn()
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce("success");

      const result = await withModelFallback(op);

      expect(result).toBe("success");
      expect(op).toHaveBeenCalledTimes(2);
      // It should fall back to gemini-3-flash-preview
      expect(op.mock.calls[1][1]).toBe("gemini-3-flash-preview");
    });

    it("formats error on complete failure (nested error object JSON)", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");

      const complexErrorStr = JSON.stringify({
        error: { message: "Deeply nested error 429" },
      });
      const op = vi.fn().mockRejectedValue(new Error(complexErrorStr)); // both calls fail

      await expect(withModelFallback(op)).rejects.toThrow(/API Quota Exceeded/);
    });

    it("formats error on complete failure (503 server error)", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");

      const err = new Error("503 Service Unavailable");
      const op = vi.fn().mockRejectedValue(err);

      await expect(withModelFallback(op)).rejects.toThrow(
        /Gemini API is currently experiencing issues/,
      );
    });

    it("throws unformatted error if unknown error format", async () => {
      vi.mocked(apiKeys.getCustomApiKey).mockReturnValue("valid-key");

      const op = vi.fn().mockRejectedValue("Just a random string error");

      await expect(withModelFallback(op)).rejects.toThrow(
        "Just a random string error",
      );
    });
  });
});
