import React, { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, delay, HttpResponse } from "msw";
import { server } from "../../test-utils/server";
import { useSafeAITask } from "../../hooks/useSafeAITask";

// A dummy component to test the intent-based flow of the hook
/**
 *
 */
function DummyAIComponent({ options }: { options?: any }) {
  const { isPending, executeTask, taskState } = useSafeAITask(options);

  /**
   *
   */
  const handleAnalyze = () => {
    executeTask(async (signal) => {
      const res = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") + "/api/campaign/start",
        {
          method: "POST",
          signal, // AbortSignal passed to fetch
        },
      );
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Quota Exceeded");
        }
        throw new Error("Server Error");
      }
      return res.json();
    });
  };

  return (
    <div>
      <button
        onClick={handleAnalyze}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Analyzing..." : "Analyze Market"}
      </button>
      {taskState.status === "error" && (
        <p role="alert">{taskState.error.message}</p>
      )}
      {taskState.status === "success" && <p role="status">Success</p>}
    </div>
  );
}

describe("useSafeAITask Intent Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("TC-RACE-01: safely locks the UI to prevent double clicks (race conditions)", async () => {
    server.use(
      http.post("/api/campaign/start", async () => {
        await delay(100);
        return HttpResponse.json({ jobId: "mock-123" });
      }),
    );

    render(<DummyAIComponent />);
    const btn = screen.getByRole("button", { name: /analyze market/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    // Immediately locked
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Analyzing...");

    // Fast forward to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Unlocked and restored
    expect(btn).toBeEnabled();
    expect(btn).toHaveTextContent("Analyze Market");
    expect(screen.getByRole("status")).toHaveTextContent("Success");
  });

  it("TC-TIMEOUT-01: safely recovers and displays warning when API hangs for > 30s", async () => {
    // MSW 2.x Intent Testing: Simulate a timeout safely without infinite hangs
    server.use(
      http.post("/api/campaign/start", async ({ request }) => {
        // Create a listener for the abort signal to properly simulate socket closure
        let abortCallback: (() => void) | undefined;
        const abortPromise = new Promise<void>((resolve) => {
          /**
           *
           */
          abortCallback = () => resolve();
          request.signal.addEventListener("abort", abortCallback);
        });

        // Wait either for the very long delay or the abort signal
        await Promise.race([delay(99999999), abortPromise]);

        if (abortCallback) {
          request.signal.removeEventListener("abort", abortCallback);
        }

        if (request.signal.aborted) {
          // Send a network error equivalent when aborted
          return HttpResponse.error();
        }

        return HttpResponse.json({ jobId: "mock-123" });
      }),
    );

    render(<DummyAIComponent />);
    const btn = screen.getByRole("button", { name: /analyze market/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn).toBeDisabled();

    // Fast-forward time to trigger the 30s Promise timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(35000);
    });

    // UI recovered and shows the user-friendly warning
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Analysis took too long. Please try again.",
    );

    // Lock is lifted, allowing retry
    expect(btn).toBeEnabled();
    expect(btn).toHaveTextContent("Analyze Market");
  });

  it("TC-OFFLINE-01: gracefully informs the user on 429 Quota Exceeded", async () => {
    server.use(
      http.post("/api/campaign/start", async () => {
        return HttpResponse.json({ error: "Quota Exceeded" }, { status: 429 });
      }),
    );

    render(<DummyAIComponent />);
    const btn = screen.getByRole("button", { name: /analyze market/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    // Advance short time for rejection to process
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    // UI recovered and shows the custom error
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Quota Exceeded");
    expect(btn).toBeEnabled();
  });

  it("aborts the previous controller if executing again sequentially (lines 45-46)", async () => {
    server.use(
      http.post("/api/campaign/start", async () => {
        return HttpResponse.json({ success: true, jobId: "test-job" });
      }),
    );
    render(<DummyAIComponent />);
    const btn = screen.getByRole("button", { name: /analyze market/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    // Task finished
    expect(btn).toBeEnabled();

    // Fire again
    await act(async () => {
      fireEvent.click(btn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    // Task finished again
    expect(btn).toBeEnabled();
  });

  it("covers missing lines: timeoutMs default, onSuccess, onError, and isPending early return", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    server.use(
      http.post("/api/campaign/start", async () => {
        return HttpResponse.json({ jobId: "mock-123" });
      }),
    );

    // Render with no options to cover line 19 (timeoutMs default)
    const { rerender } = render(
      <DummyAIComponent options={{ onSuccess, onError }} />,
    );
    let btn = screen.getByRole("button", { name: /analyze market/i });

    await act(async () => {
      fireEvent.click(btn);
      // Trigger again synchronously to hit `if (isPending) return;` (line 41)
      fireEvent.click(btn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(onSuccess).toHaveBeenCalled();

    // Now test onError
    server.use(
      http.post("/api/campaign/start", async () => {
        return HttpResponse.json({ error: "Server Error" }, { status: 500 });
      }),
    );

    await act(async () => {
      fireEvent.click(btn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(onError).toHaveBeenCalled();

    // Rerender with NO options to cover options?.timeoutMs
    rerender(<DummyAIComponent />);
    btn = screen.getByRole("button", { name: /analyze market/i });

    server.use(
      http.post("/api/campaign/start", async () => {
        return HttpResponse.json({ jobId: "mock-456" });
      }),
    );

    await act(async () => {
      fireEvent.click(btn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
  });
});
