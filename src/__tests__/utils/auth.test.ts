import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// We import the soon-to-be-implemented utility
import { fetchTokenResiliently } from "../../../src/utils/auth";

describe("fetchTokenResiliently (RED Tests)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should successfully fetch a token on the first try", async () => {
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue("mock-token-123"),
    };
    const abortController = new AbortController();

    const tokenPromise = fetchTokenResiliently(
      mockUser as any,
      abortController.signal,
    );
    await vi.runAllTimersAsync();

    const token = await tokenPromise;
    expect(token).toBe("mock-token-123");
    expect(mockUser.getIdToken).toHaveBeenCalledTimes(1);
  });

  it("should retry with exponential backoff on transient errors and eventually succeed", async () => {
    const mockUser = {
      getIdToken: vi
        .fn()
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValue("mock-token-retry"),
    };
    const abortController = new AbortController();

    const tokenPromise = fetchTokenResiliently(
      mockUser as any,
      abortController.signal,
    );

    // It should fail the first two times, requiring time advancement
    // We expect the implementation to wait between retries (e.g., 500ms, then 1000ms)
    await vi.advanceTimersByTimeAsync(500); // Advance first backoff
    await vi.advanceTimersByTimeAsync(1000); // Advance second backoff
    await vi.runAllTimersAsync(); // Flush the rest

    const token = await tokenPromise;
    expect(token).toBe("mock-token-retry");
    expect(mockUser.getIdToken).toHaveBeenCalledTimes(3);
  });

  it("should abort immediately if the AbortSignal is triggered during retries", async () => {
    const mockUser = {
      // Always fails to force retries
      getIdToken: vi.fn().mockRejectedValue(new Error("Network Error")),
    };
    const abortController = new AbortController();

    const tokenPromise = fetchTokenResiliently(
      mockUser as any,
      abortController.signal,
    );
    tokenPromise.catch(() => {});

    // Let it fail once and enter the waiting period
    await vi.advanceTimersByTimeAsync(100);

    // Abort the operation mid-flight (e.g., component unmounted)
    abortController.abort();

    // Advance remaining time
    await vi.runAllTimersAsync();

    // Should reject with an AbortError instead of trying again
    await expect(tokenPromise).rejects.toThrow("aborted");
  });

  it("should enforce a strict 5-second circuit breaker before bubbling up errors", async () => {
    const mockUser = {
      // Always fails
      getIdToken: vi
        .fn()
        .mockRejectedValue(new Error("Persistent Network Error")),
    };
    const abortController = new AbortController();

    // The promise should not resolve, we want to measure how long it takes to reject
    const tokenPromise = fetchTokenResiliently(
      mockUser as any,
      abortController.signal,
    );

    // Catch the rejection so Vitest doesn't fail the suite
    const catchFn = vi.fn();
    tokenPromise.catch(catchFn);

    // Advance time by 4.9 seconds
    await vi.advanceTimersByTimeAsync(4900);
    expect(catchFn).not.toHaveBeenCalled();

    // Advance to 5 seconds
    await vi.advanceTimersByTimeAsync(100);

    // The circuit breaker should have triggered and rejected the promise
    await vi.runAllTimersAsync();
    expect(catchFn).toHaveBeenCalled();

    const error = catchFn.mock.calls[0][0];
    expect(error.message).toMatch(/Circuit breaker|timeout/i);
  });
});
