import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TelemetryBatcher } from "../../utils/telemetry";

describe("telemetry", () => {
  let batcher: TelemetryBatcher;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
    // Stub requestIdleCallback
    vi.stubGlobal(
      "requestIdleCallback",
      vi.fn((cb) => {
        setTimeout(cb, 10);
        return 1;
      }),
    );

    // Stub navigator.sendBeacon
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });

    batcher = new TelemetryBatcher();
  });

  afterEach(() => {
    batcher.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should queue events and flush them asynchronously", async () => {
    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    // Check internal queue
    expect((batcher as any).queue.length).toBe(1);

    // Advance timers to trigger requestIdleCallback/setTimeout
    vi.advanceTimersByTime(20);

    // Await any pending promises from the flush
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect((batcher as any).queue.length).toBe(0);
  });

  it("should fallback to setTimeout if requestIdleCallback is not available", async () => {
    // Override window.requestIdleCallback to trigger fallback logic
    const originalRic = (window as any).requestIdleCallback;
    delete (window as any).requestIdleCallback;

    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    vi.advanceTimersByTime(1001);

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    (window as any).requestIdleCallback = originalRic;
  });

  it("should handle visibilitychange hidden event by calling flushSync", () => {
    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    // Mock document.visibilityState
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });

    // Trigger event
    window.dispatchEvent(new Event("visibilitychange"));

    expect(global.navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect((batcher as any).queue.length).toBe(0);
  });

  it("should handle visibilitychange without sendBeacon gracefully", () => {
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });

    window.dispatchEvent(new Event("visibilitychange"));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((batcher as any).queue.length).toBe(0);
  });

  it("should drop 400 errors silently and log other errors", async () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    vi.advanceTimersByTime(20);

    await vi.waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("status: 500"),
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it("should handle network errors gracefully", async () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network disconnect")),
    );

    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    vi.advanceTimersByTime(20);

    await vi.waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Network error during telemetry flush",
        expect.any(Error),
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it("should not push events after disposal", () => {
    batcher.dispose();

    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
      actorType: "human",
    });

    expect((batcher as any).queue.length).toBe(0);
  });

  it("should detect agent sessions properly", () => {
    (window as any).__AGENT_SESSION__ = true;

    batcher.push({
      eventType: "activation",
      projectId: "test-proj",
      payload: {},
    } as any); // Omit actorType to trigger the fallback logic

    const queuedEvent = (batcher as any).queue[0];
    expect(queuedEvent.actorType).toBe("agent");

    delete (window as any).__AGENT_SESSION__;
  });
});
