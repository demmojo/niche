import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import {
  generateContentHandler,
  generateContentStreamHandler,
  reviewArtifactHandler,
} from "../../server/llmRoutes";
import { server } from "../../test-utils/server";
import { http, passthrough } from "msw";

// Mock providers
const mockGeminiGenerateContent = vi.fn();
const mockGeminiStream = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGeminiGenerateContent,
        generateContentStream: mockGeminiStream,
      },
    })),
  };
});

const mockOpenAICreate = vi.fn();
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
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

// Setup ephemeral app
const app = express();
app.use(express.json());

// AGENTS.md rule: Test-only middleware to intercept and ignore the `close` event listener
// attachment specifically for the test environment to prevent supertest SSE aborts.
app.use((req, res, next) => {
  const originalOn = req.on.bind(req);
  req.on = (event: string, listener: any) => {
    if (event === "close") {
      return req; // ignore
    }
    return originalOn(event, listener);
  };
  next();
});

// Handlers
app.use((req, res, next) => {
  (req as any).llmApiKey = "mock-api-key";
  next();
});
app.post("/api/llm/generate", generateContentHandler as any);
app.post("/api/llm/stream", generateContentStreamHandler as any);
app.post("/api/llm/review", reviewArtifactHandler as any);

describe("llmRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.post("*/api/llm/generate", () => passthrough()),
      http.post("*/api/llm/stream", () => passthrough()),
      http.post("*/api/llm/review", () => passthrough()),
    );
  });

  describe("generateContentHandler", () => {
    it("handles Gemini provider requests", async () => {
      mockGeminiGenerateContent.mockResolvedValueOnce({
        text: "Gemini response",
      });

      const res = await request(app)
        .post("/api/llm/generate")
        .send({
          model: "gemini-3.1-pro",
          params: { contents: "hello" },
        });

      expect(res.status).toBe(200);
      expect(res.body.text).toBe("Gemini response");
      expect(mockGeminiGenerateContent).toHaveBeenCalled();
    });

    it("handles OpenAI provider requests", async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        id: "req_123",
        choices: [{ message: { content: "OpenAI response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      });

      const res = await request(app)
        .post("/api/llm/generate")
        .set("Authorization", "Bearer MOCK")
        .send({
          model: "gpt-4o",
          params: { contents: "hello" },
          sensitive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.text).toBe("OpenAI response");
      expect(res.body.ephemeralityReceipt).toBeDefined();
      expect(mockOpenAICreate).toHaveBeenCalled();
    });

    it("handles Anthropic provider requests", async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        id: "msg_123",
        content: [{ type: "text", text: "Anthropic response" }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const res = await request(app)
        .post("/api/llm/generate")
        .send({
          model: "claude-3-5-sonnet",
          params: { contents: "hello" },
        });

      expect(res.status).toBe(200);
      expect(res.body.text).toBe("Anthropic response");
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it("handles rate limits and sets 429 status", async () => {
      mockGeminiGenerateContent.mockRejectedValueOnce({
        status: 429,
        message: "Rate limit",
      });

      const res = await request(app)
        .post("/api/llm/generate")
        .send({
          model: "gemini-3.1-pro",
          params: { contents: "hello" },
        });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe("Rate limit");
    });
  });

  describe("generateContentStreamHandler", () => {
    it("handles stream response for Gemini", async () => {
      mockGeminiStream.mockResolvedValueOnce([
        { text: "chunk 1" },
        { text: "chunk 2" },
      ]);

      const res = await request(app)
        .post("/api/llm/stream")
        .send({
          model: "gemini-3.1-flash",
          params: { contents: "stream me" },
        });

      expect(res.status).toBe(200);
      expect(res.text).toContain("chunk 1");
      expect(res.text).toContain("chunk 2");
      expect(res.text).toContain("[DONE]");
    });
  });

  describe("reviewArtifactHandler", () => {
    it("validates artifact using structured JSON output from Gemini", async () => {
      mockGeminiGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          isToneCompliant: true,
          isStackCompliant: true,
          feedback: "Great job!",
        }),
      });

      const res = await request(app).post("/api/llm/review").send({
        code: "const a = 1;",
        constraints: "React 19 only",
        brandTone: "Friendly",
      });

      expect(res.status).toBe(200);
      expect(res.body.isToneCompliant).toBe(true);
      expect(res.body.isStackCompliant).toBe(true);
      expect(res.body.feedback).toBe("Great job!");
    });

    it("returns 400 if constraints or code are missing", async () => {
      const res = await request(app)
        .post("/api/llm/review")
        .send({ code: "const a = 1;" }); // Missing constraints

      expect(res.status).toBe(400);
    });

    it("returns 500 if JSON parsing fails", async () => {
      mockGeminiGenerateContent.mockResolvedValueOnce({
        text: "Invalid JSON response from LLM",
      });

      const res = await request(app).post("/api/llm/review").send({
        code: "const a = 1;",
        constraints: "React 19",
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to validate artifact.");
    });
  });
});
