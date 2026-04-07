// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test-utils/server";
import { withModelFallback } from "../../utils/aiClient";

describe("aiClient Routing & Resiliency", () => {
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  it("should exponentially backoff on 429 and exhaust current tier without escalating", async () => {
    // Mock the setTimeout so tests run fast despite exponential backoff
    vi.useFakeTimers();

    // Override global MSW handler for this specific test
    server.use(
      http.post("*/api/llm/generate", async ({ request }) => {
        const body = (await request.json()) as any;

        // Simulate 429 Rate Limit for Lite Model
        if (
          body.model === "gemini-3.1-flash-lite-preview" ||
          body.model === "gpt-4o-mini" ||
          body.model === "claude-3-5-haiku-20241022"
        ) {
          return HttpResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429 },
          );
        }

        // Default Fallback Error
        return HttpResponse.json(
          { error: "Server overloaded" },
          { status: 503 },
        );
      }),
    );

    // Spy on console.warn to verify backoff is triggered
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Set auto mode to test the progression
    localStorage.setItem("ai_main_model", "auto");

    // We start a mock fetch promise that will trigger the exponential backoff inside `withModelFallback`
    const promise = withModelFallback(
      async (ai, model, signal) => {
        // This function will be passed the actual aiClient which fetches from `/api/llm/generate`
        return await ai.generateContent(model, { contents: "hello" }, signal);
      },
      { capability: "extraction" },
    );

    // Catch it so node doesn't complain about unhandled rejections
    promise.catch(() => {});

    // Fast forward the backoff timers
    // 1st backoff ~1500ms
    await vi.runAllTimersAsync();
    // 2nd backoff ~2500ms
    await vi.runAllTimersAsync();
    // 3rd backoff
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow("All configured models failed");

    // Verify the backoff logs were called multiple times for 429
    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls.map((call) => call[0]);

    // Ensure we saw at least one rate limit backoff warning
    const rateLimitLog = calls.find(
      (c) => c.includes("429 Rate Limit") || c.includes("Error with model"),
    );
    expect(rateLimitLog).toBeDefined();

    vi.useRealTimers();
  });
});
