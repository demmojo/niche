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
});
