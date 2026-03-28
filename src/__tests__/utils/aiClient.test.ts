import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAvailableModels,
  getSelectedModels,
  setSelectedModels,
  withModelFallback,
} from "../../utils/aiClient";
import * as apiKeys from "../../utils/apiKeys";

// --- Mocks ---
const mockGeminiGenerateContent = vi.fn();
const mockGeminiGenerateContentStream = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGeminiGenerateContent,
      generateContentStream: mockGeminiGenerateContentStream,
    },
  })),
}));

const mockOpenAICreate = vi.fn();
const mockOpenAIList = vi.fn();

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      models: {
        list: mockOpenAIList,
      },
      chat: {
        completions: {
          create: mockOpenAICreate,
        },
      },
    })),
  };
});

const mockAnthropicCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockAnthropicCreate,
      },
    })),
  };
});

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

  describe("getSelectedModels / setSelectedModels", () => {
    it("returns default gemini model when local storage is empty", () => {
      expect(getSelectedModels()).toEqual(["gemini-3-flash-preview"]);
    });

    it("returns default gemini model when local storage is invalid JSON", () => {
      localStorage.setItem("ai_selected_models", "{ invalid json ]");
      expect(getSelectedModels()).toEqual(["gemini-3-flash-preview"]);
    });

    it("setSelectedModels and getSelectedModels work together", () => {
      setSelectedModels(["gpt-4o", "claude-3-opus-20240229"]);
      expect(getSelectedModels()).toEqual(["gpt-4o", "claude-3-opus-20240229"]);
    });
  });

  describe("fetchAvailableModels", () => {
    it("returns base gemini models by default", async () => {
      const models = await fetchAvailableModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.provider === "gemini")).toBe(true);
      expect(models.some((m) => m.provider === "openai")).toBe(false);
      expect(models.some((m) => m.provider === "anthropic")).toBe(false);
    });

    it("returns openai models when key is present", async () => {
      mockKeys["openai"] = "test-key";
      mockOpenAIList.mockResolvedValueOnce({
        data: [
          { id: "gpt-4o" },
          { id: "gpt-3.5-turbo" },
          { id: "o1-preview" },
          { id: "o3-mini" },
          { id: "dall-e" },
        ],
      });
      const models = await fetchAvailableModels();
      // Should filter to gpt-4, gpt-3.5, o1, o3
      expect(models.some((m) => m.id === "gpt-4o")).toBe(true);
      expect(models.some((m) => m.id === "gpt-3.5-turbo")).toBe(true);
      expect(models.some((m) => m.id === "o1-preview")).toBe(true);
      expect(models.some((m) => m.id === "o3-mini")).toBe(true);
      expect(models.some((m) => m.id === "dall-e")).toBe(false);
    });

    it("handles openai API failure gracefully", async () => {
      mockKeys["openai"] = "test-key";
      mockOpenAIList.mockRejectedValueOnce(new Error("Network error"));
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const models = await fetchAvailableModels();
      expect(models.some((m) => m.provider === "openai")).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch OpenAI models",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("returns anthropic models when key is present", async () => {
      mockKeys["anthropic"] = "test-key";
      const models = await fetchAvailableModels();
      expect(models.some((m) => m.provider === "anthropic")).toBe(true);
      expect(models.some((m) => m.id === "claude-3-7-sonnet-20250219")).toBe(
        true,
      );
    });
  });

  describe("withModelFallback & AIClient basics", () => {
    it("throws if no AI models selected", async () => {
      setSelectedModels([]);
      await expect(withModelFallback(async () => {})).rejects.toThrow(
        "No AI models selected",
      );
    });

    it("throws if no API keys are available for any configured model", async () => {
      setSelectedModels(["gemini-3.1-pro-preview", "gpt-4o"]);
      mockKeys["gemini"] = null;
      mockKeys["openai"] = null;

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await expect(withModelFallback(async () => {})).rejects.toThrow(
        "No API key available for any of the configured models.",
      );

      consoleWarnSpy.mockRestore();
    });

    it("uses primary model if successful", async () => {
      mockKeys["openai"] = "test-key";
      setSelectedModels(["gpt-4o"]);

      const mockOperation = vi.fn().mockResolvedValue("success");
      const result = await withModelFallback(mockOperation);

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith(expect.anything(), "gpt-4o");
    });

    it("falls back to second model if primary fails with rate limit error", async () => {
      mockKeys["openai"] = "test-key";
      mockKeys["anthropic"] = "test-key2";
      setSelectedModels(["gpt-4o", "claude-3-5-sonnet-20241022"]);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const rateLimitError = new Error("429 Rate Limit Exceeded");
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce("success2");

      const result = await withModelFallback(mockOperation);

      expect(result).toBe("success2");
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        "gpt-4o",
      );
      expect(mockOperation).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        "claude-3-5-sonnet-20241022",
      );

      consoleErrorSpy.mockRestore();
    });

    it("throws custom RateLimit error when all models fail and last error is rate limit", async () => {
      mockKeys["openai"] = "test-key";
      setSelectedModels(["gpt-4o"]);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const rateLimitError = new Error("429 Rate Limit Exceeded");
      const mockOperation = vi.fn().mockRejectedValue(rateLimitError);

      await expect(withModelFallback(mockOperation)).rejects.toThrow(
        "RateLimit:CustomKey:429 Rate Limit Exceeded",
      );

      consoleErrorSpy.mockRestore();
    });

    it("throws custom RateLimit:GlobalKey error when all models fail and no custom key is used", async () => {
      process.env.GEMINI_API_KEY = "env-key";
      mockKeys["gemini"] = null;
      setSelectedModels(["gemini-3.1-pro-preview"]);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const rateLimitError = new Error("quota exceeded");
      const mockOperation = vi.fn().mockRejectedValue(rateLimitError);

      await expect(withModelFallback(mockOperation)).rejects.toThrow(
        "RateLimit:GlobalKey:quota exceeded",
      );

      consoleErrorSpy.mockRestore();
    });

    it("throws generic error when all models fail and last error is NOT a rate limit", async () => {
      mockKeys["openai"] = "test-key";
      setSelectedModels(["gpt-4o"]);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const genericError = new Error("Some random network error");
      const mockOperation = vi.fn().mockRejectedValue(genericError);

      await expect(withModelFallback(mockOperation)).rejects.toThrow(
        "Some random network error",
      );

      consoleErrorSpy.mockRestore();
    });

    it("respects timeout logic and falls back", async () => {
      mockKeys["openai"] = "test-key";
      mockKeys["gemini"] = "test-key2";
      setSelectedModels(["gpt-4o", "gemini-3.1-pro-preview"]);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockOperation = vi
        .fn()
        .mockImplementationOnce(async () => {
          await new Promise((r) => setTimeout(r, 100));
          return "slow result";
        })
        .mockResolvedValueOnce("fast fallback result");

      const result = await withModelFallback(mockOperation, 50);

      expect(result).toBe("fast fallback result");
      expect(mockOperation).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("AIClient.generateContent capabilities", () => {
    let aiClient: any;

    beforeEach(async () => {
      mockKeys["gemini"] = "test-key";
      setSelectedModels(["gemini-3.1-pro-preview"]);
      await withModelFallback(async (ai) => {
        aiClient = ai;
        return true;
      });
    });

    describe("Gemini provider", () => {
      it("throws if no Gemini API key available", async () => {
        mockKeys["gemini"] = null;
        delete process.env.GEMINI_API_KEY;
        await expect(
          aiClient.generateContent("gemini-3.1-pro-preview", {
            contents: "hi",
          }),
        ).rejects.toThrow("No Gemini API key available.");
        await expect(
          aiClient.generateContentStream("gemini-3.1-pro-preview", {
            contents: "hi",
          }),
        ).rejects.toThrow("No Gemini API key available.");
      });

      it("calls GoogleGenAI generateContent with proper arguments", async () => {
        process.env.GEMINI_API_KEY = "env-key";
        mockGeminiGenerateContent.mockResolvedValueOnce({
          text: "gemini response",
        });

        const params = {
          contents: "hello",
          config: { responseMimeType: "application/json" },
        };
        const res = await aiClient.generateContent(
          "gemini-3.1-pro-preview",
          params,
        );

        expect(res).toEqual({ text: "gemini response" });
        expect(mockGeminiGenerateContent).toHaveBeenCalledWith({
          model: "gemini-3.1-pro-preview",
          contents: "hello",
          config: params.config,
        });
      });

      it("calls GoogleGenAI generateContentStream with proper arguments", async () => {
        process.env.GEMINI_API_KEY = "env-key";
        mockGeminiGenerateContentStream.mockResolvedValueOnce({
          text: "stream chunk",
        });

        const res = await aiClient.generateContentStream(
          "gemini-3.1-pro-preview",
          { contents: "hello" },
        );

        expect(res).toEqual({ text: "stream chunk" });
        expect(mockGeminiGenerateContentStream).toHaveBeenCalledWith({
          model: "gemini-3.1-pro-preview",
          contents: "hello",
          config: undefined,
        });
      });
    });

    describe("OpenAI provider", () => {
      beforeEach(() => {
        mockKeys["openai"] = "test-key";
      });

      it("throws if no OpenAI API key available", async () => {
        mockKeys["openai"] = null;
        await expect(
          aiClient.generateContent("gpt-4o", { contents: "hi" }),
        ).rejects.toThrow("No OpenAI API key available.");
      });

      it("formats request without tools or json schema correctly", async () => {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [
            { message: { content: "openai response", tool_calls: undefined } },
          ],
        });

        const res = await aiClient.generateContent("gpt-4o", {
          contents: "hello openai",
        });

        expect(res).toEqual({
          text: "openai response",
          functionCalls: undefined,
        });
        expect(mockOpenAICreate).toHaveBeenCalledWith({
          model: "gpt-4o",
          messages: [{ role: "user", content: "hello openai" }],
          response_format: undefined,
          tools: undefined,
        });
      });

      it("formats json schema request correctly", async () => {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [{ message: { content: '{"ok": true}' } }],
        });

        const params = {
          contents: "hello",
          config: {
            responseMimeType: "application/json",
            responseSchema: { type: "object" },
          },
        };

        const res = await aiClient.generateContent("gpt-4o", params);

        expect(res.text).toBe('{"ok": true}');
        expect(mockOpenAICreate).toHaveBeenCalledWith(
          expect.objectContaining({
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: expect.stringContaining(
                  'Follow this JSON schema strictly: {"type":"object"}',
                ),
              },
              { role: "user", content: "hello" },
            ],
          }),
        );
      });

      it("formats tools correctly and parses tool calls", async () => {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: "",
                tool_calls: [
                  {
                    function: {
                      name: "myTool",
                      arguments: '{"arg1":"value1"}',
                    },
                  },
                ],
              },
            },
          ],
        });

        const params = {
          contents: "call tool",
          config: {
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "myTool",
                    description: "Does something",
                    parameters: { type: "object" },
                  },
                ],
              },
            ],
          },
        };

        const res = await aiClient.generateContent("gpt-4o", params);

        expect(res.functionCalls).toBeDefined();
        expect(res.functionCalls[0]).toEqual({
          name: "myTool",
          args: { arg1: "value1" },
        });

        expect(mockOpenAICreate).toHaveBeenCalledWith(
          expect.objectContaining({
            tools: [
              {
                type: "function",
                function: {
                  name: "myTool",
                  description: "Does something",
                  parameters: { type: "object" },
                },
              },
            ],
          }),
        );
      });

      it("returns dummy stream for generateContentStream", async () => {
        mockOpenAICreate.mockResolvedValueOnce({
          choices: [{ message: { content: "openai response" } }],
        });

        const stream = await aiClient.generateContentStream("gpt-4o", {
          contents: "hello openai",
        });
        const result = await stream.next();

        expect(result.value).toEqual({
          text: "openai response",
          functionCalls: undefined,
        });
        expect(result.done).toBe(false);
      });
    });

    describe("Anthropic provider", () => {
      beforeEach(() => {
        mockKeys["anthropic"] = "test-key";
      });

      it("throws if no Anthropic API key available", async () => {
        mockKeys["anthropic"] = null;
        await expect(
          aiClient.generateContent("claude-3-opus-20240229", {
            contents: "hi",
          }),
        ).rejects.toThrow("No Anthropic API key available.");
      });

      it("formats request without tools or json schema correctly", async () => {
        mockAnthropicCreate.mockResolvedValueOnce({
          content: [{ type: "text", text: "anthropic response" }],
        });

        const res = await aiClient.generateContent("claude-3-opus-20240229", {
          contents: "hello claude",
        });

        expect(res).toEqual({
          text: "anthropic response",
          functionCalls: undefined,
        });
        expect(mockAnthropicCreate).toHaveBeenCalledWith({
          model: "claude-3-opus-20240229",
          max_tokens: 4096,
          system: undefined,
          messages: [{ role: "user", content: "hello claude" }],
          tools: undefined,
        });
      });

      it("formats json schema request correctly", async () => {
        mockAnthropicCreate.mockResolvedValueOnce({
          content: [{ type: "text", text: '{"ok": true}' }],
        });

        const params = {
          contents: "hello",
          config: {
            responseMimeType: "application/json",
            responseSchema: { type: "object" },
          },
        };

        const res = await aiClient.generateContent(
          "claude-3-opus-20240229",
          params,
        );

        expect(res.text).toBe('{"ok": true}');
        expect(mockAnthropicCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            system: expect.stringContaining(
              'Follow this JSON schema strictly: {"type":"object"}',
            ),
          }),
        );
      });

      it("formats tools correctly and parses tool calls", async () => {
        mockAnthropicCreate.mockResolvedValueOnce({
          content: [
            { type: "text", text: "Using tool" },
            { type: "tool_use", name: "myTool", input: { arg1: "value1" } },
          ],
        });

        const params = {
          contents: "call tool",
          config: {
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "myTool",
                    description: "Does something",
                    parameters: { type: "object" },
                  },
                ],
              },
            ],
          },
        };

        const res = await aiClient.generateContent(
          "claude-3-opus-20240229",
          params,
        );

        expect(res.text).toBe("Using tool");
        expect(res.functionCalls).toBeDefined();
        expect(res.functionCalls[0]).toEqual({
          name: "myTool",
          args: { arg1: "value1" },
        });

        expect(mockAnthropicCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            tools: [
              {
                name: "myTool",
                description: "Does something",
                input_schema: { type: "object" },
              },
            ],
          }),
        );
      });

      it("returns dummy stream for generateContentStream", async () => {
        mockAnthropicCreate.mockResolvedValueOnce({
          content: [{ type: "text", text: "anthropic response" }],
        });

        const stream = await aiClient.generateContentStream(
          "claude-3-5-sonnet-20241022",
          { contents: "hello claude" },
        );
        const result = await stream.next();

        expect(result.value).toEqual({
          text: "anthropic response",
          functionCalls: undefined,
        });
        expect(result.done).toBe(false);
      });
    });
  });
});
