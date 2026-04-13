// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNicheGenerativeStream } from "../../hooks/useNicheGenerativeStream";

describe("useNicheGenerativeStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Stub fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("handles decoupled chunk ingestion correctly (throttling)", async () => {
    // Mock fetch to return a stream
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream({
      start(c) {
        controller = c;
      },
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: stream,
    });

    const { result } = renderHook(() =>
      useNicheGenerativeStream({ endpoint: "/api/test", throttleMs: 100 }),
    );

    // Start generation
    let generatePromise: Promise<void>;
    await act(async () => {
      generatePromise = result.current.generate({});
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe("");

    const encoder = new TextEncoder();

    // Enqueue first chunk
    await act(async () => {
      controller.enqueue(encoder.encode(`data: {"text":"Hello"}\n\n`));
    });

    // Data should NOT be updated yet due to throttling
    expect(result.current.data).toBe("");

    // Fast forward halfway through throttle
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Enqueue second chunk before flush
    await act(async () => {
      controller.enqueue(encoder.encode(`data: {"text":" World"}\n\n`));
    });

    // Still shouldn't update
    expect(result.current.data).toBe("");

    // Fast forward to trigger flush
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // Now both chunks should appear
    expect(result.current.data).toBe("Hello World");

    // Close stream
    await act(async () => {
      controller.close();
    });
    await act(async () => {
      await generatePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("gracefully drops malformed chunks without crashing", async () => {
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream({
      start(c) {
        controller = c;
      },
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: stream,
    });

    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useNicheGenerativeStream({ endpoint: "/api/test", throttleMs: 0 }),
    );

    let generatePromise: Promise<void>;
    await act(async () => {
      generatePromise = result.current.generate({});
    });

    const encoder = new TextEncoder();

    // Valid chunk
    await act(async () => {
      controller.enqueue(encoder.encode(`data: {"text":"Valid."}\n\n`));
      vi.runAllTimers();
    });

    // Malformed JSON chunk
    await act(async () => {
      controller.enqueue(encoder.encode(`data: {malformed}\n\n`));
      vi.runAllTimers();
    });

    // Invalid schema chunk
    await act(async () => {
      controller.enqueue(encoder.encode(`data: {"wrong_key":"data"}\n\n`));
      vi.runAllTimers();
    });

    // Another valid chunk
    await act(async () => {
      controller.enqueue(encoder.encode(`data: {"text":" Done."}\n\n`));
      vi.runAllTimers();
    });

    // Close stream FIRST to trigger flushBuffer
    await act(async () => {
      controller.close();
      await generatePromise;
    });

    expect(result.current.data).toBe("Valid. Done.");
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it("handles server sent errors", async () => {
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream({
      start(c) {
        controller = c;
      },
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: stream,
    });

    const { result } = renderHook(() =>
      useNicheGenerativeStream({ endpoint: "/api/test", throttleMs: 0 }),
    );

    let generatePromise: Promise<void>;
    await act(async () => {
      generatePromise = result.current.generate({});
    });

    const encoder = new TextEncoder();

    await act(async () => {
      controller.enqueue(
        encoder.encode(
          `data: {"error":"STREAM_FAILED","message":"Custom Error"}\n\n`,
        ),
      );
      vi.runAllTimers();
    });

    await act(async () => {
      controller.close();
    });

    await act(async () => {
      await generatePromise;
    });

    expect(result.current.error).toBe("Custom Error");
    expect(result.current.isLoading).toBe(false);
  });
});
