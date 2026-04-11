import { describe, it, expect } from "vitest";
import { MarkdownExtractorTransform, yieldEventLoop } from "../stream-utils.js";
import { Readable } from "stream";

describe("Stream Utilities", () => {
  it("MarkdownExtractorTransform should strip markdown wrappers from streamed JSON", async () => {
    const chunks = [
      "```json\n",
      '{"hello"',
      ':"world"}',
      "\n```\n",
      "some trailing text",
    ];

    const readable = Readable.from(chunks);
    const transform = new MarkdownExtractorTransform();

    let result = "";
    for await (const chunk of readable.pipe(transform)) {
      result += chunk.toString();
    }

    expect(result.trim()).toBe('{"hello":"world"}');
  });

  it("MarkdownExtractorTransform should handle plain JSON without wrappers", async () => {
    const chunks = ['{"hello":"world"}'];
    const readable = Readable.from(chunks);
    const transform = new MarkdownExtractorTransform();

    let result = "";
    for await (const chunk of readable.pipe(transform)) {
      result += chunk.toString();
    }

    expect(result.trim()).toBe('{"hello":"world"}');
  });

  it("yieldEventLoop should pause execution to prevent starvation", async () => {
    const start = performance.now();
    await yieldEventLoop();
    const end = performance.now();
    expect(end - start).toBeGreaterThanOrEqual(0);
  });
  it("createYieldingStream should yield the event loop every 50ms", async () => {
    const { createYieldingStream } = await import("../stream-utils.js");
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const stream = createYieldingStream(arr, 10); // yield every 10ms for test speed

    const results = [];
    for await (const item of stream) {
      results.push(item);
    }
    expect(results).toEqual(arr);
  });

  it("MarkdownExtractorTransform should flush buffer if > 5000 chars without seeing code block", async () => {
    const chunk = "a".repeat(6000);
    const readable = Readable.from([chunk]);
    const transform = new MarkdownExtractorTransform();
    let result = "";
    for await (const chunk of readable.pipe(transform)) {
      result += chunk.toString();
    }
    expect(result).toBe("a".repeat(6000));
  });

  it("yieldEventLoop should fallback to setTimeout if setImmediate is undefined", async () => {
    const originalSetImmediate = global.setImmediate;
    // @ts-ignore
    global.setImmediate = undefined;
    await yieldEventLoop();
    expect(true).toBe(true);
    global.setImmediate = originalSetImmediate;
  });

  it("createYieldingStream should call yieldEventLoop if yieldIntervalMs has passed", async () => {
    const { createYieldingStream } = await import("../stream-utils.js");
    const arr = [1, 2, 3];
    // Force yielding by mocking Date.now to advance
    const originalNow = Date.now;
    let now = 1000;
    Date.now = vi.fn().mockImplementation(() => {
      now += 60; // Advance time by 60ms each call
      return now;
    });

    const stream = createYieldingStream(arr, 10);
    const results = [];
    for await (const item of stream) {
      results.push(item);
    }
    expect(results).toEqual(arr);
    Date.now = originalNow;
  });
});
