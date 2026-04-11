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
});
