import { Transform, TransformCallback } from "stream";

/**
 * Strips LLM Markdown wrappers like ```json and ``` from streamed chunks.
 */
export class MarkdownExtractorTransform extends Transform {
  private buffer = "";
  private insideCodeBlock = false;
  private hasSeenCodeBlock = false;

  constructor() {
    super({ readableObjectMode: false, writableObjectMode: false });
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    const text = chunk.toString();
    this.buffer += text;
    this.processBuffer();
    callback();
  }

  _flush(callback: TransformCallback): void {
    this.processBuffer(true);
    callback();
  }

  private processBuffer(flush: boolean = false) {
    if (!this.hasSeenCodeBlock) {
      const match = this.buffer.match(/```[a-z]*\n/);
      if (match) {
        this.hasSeenCodeBlock = true;
        this.insideCodeBlock = true;
        // Output everything before the match? No, discard anything before ```json.
        // Usually, LLM chat goes "Here is the JSON: ```json ..."
        this.buffer = this.buffer.substring(match.index! + match[0].length);
      } else if (flush) {
        // If we flush and never saw a code block, just output the whole buffer
        this.push(this.buffer);
        this.buffer = "";
        return;
      } else {
        // If buffer gets too large without finding ```, maybe it doesn't have one.
        // Wait until flush or just push if > 1000 chars.
        if (this.buffer.length > 5000) {
          this.push(this.buffer);
          this.buffer = "";
        }
        return;
      }
    }

    if (this.insideCodeBlock) {
      const endMatch = this.buffer.match(/\n```/);
      if (endMatch) {
        this.insideCodeBlock = false;
        // Push everything up to \n```
        this.push(this.buffer.substring(0, endMatch.index));
        // Discard the rest
        this.buffer = "";
      } else if (flush) {
        // Push whatever is left
        this.push(this.buffer);
        this.buffer = "";
      } else {
        // We are inside the code block. Push all but the last 4 chars (in case it's \n``)
        if (this.buffer.length > 4) {
          const safeChunk = this.buffer.substring(0, this.buffer.length - 4);
          this.push(safeChunk);
          this.buffer = this.buffer.substring(this.buffer.length - 4);
        }
      }
    }
  }
}

/**
 * Yields the event loop to prevent starvation during intensive synchronous tasks.
 * Uses setImmediate if available, falling back to setTimeout.
 */
export function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof setImmediate !== "undefined") {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Creates an async generator that yields items from an iterable,
 * pausing the event loop via `setImmediate` periodically (default 50ms)
 * to prevent event loop starvation during intensive processing.
 */
export async function* createYieldingStream<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
  yieldIntervalMs: number = 50,
): AsyncGenerator<T, void, unknown> {
  let lastYield = Date.now();

  for await (const item of iterable) {
    yield item;

    const now = Date.now();
    if (now - lastYield > yieldIntervalMs) {
      await yieldEventLoop();
      lastYield = Date.now();
    }
  }
}
