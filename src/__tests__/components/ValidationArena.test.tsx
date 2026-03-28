import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { doc, setDoc } from "firebase/firestore";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
  beforeEach,
} from "vitest";
import { server } from "../../test-utils/server";

// Note: since ValidationArena and MarketIntelligence flows might be tightly coupled or we need a test harness
// We will test the "Snapshot Beats the Fetch" race condition here.

// We will mock a simplified version of the Campaign Dashboard that suffers from the race condition
// to prove our testing strategy works as defined in the plan.
function MockCampaignDashboard({ campaignId }: { campaignId: string }) {
  const [status, setStatus] = React.useState("active");
  const [isPending, startTransition] = React.useTransition();

  // Mock Firebase snapshot listener
  React.useEffect(() => {
    // In a real component, this would be onSnapshot
    // We simulate it globally for the test
    const handler = (e: any) => {
      if (e.detail.id === campaignId) {
        setStatus(e.detail.status);
      }
    };
    window.addEventListener("mock-snapshot", handler);
    return () => window.removeEventListener("mock-snapshot", handler);
  }, [campaignId]);

  const handleArchive = () => {
    startTransition(async () => {
      setStatus("loading");
      const res = await fetch(`/api/campaigns/${campaignId}/archive`, {
        method: "POST",
      });
      const data = await res.json();
      // Fixed pattern: Only update if the snapshot hasn't already moved us to a different final state
      // Real NicheAI code uses optimistic UI with rollback, or trusts the snapshot entirely
      if (data.success) {
        setStatus((prev) => {
          // If the snapshot has already locked the campaign, don't overwrite it
          if (prev === "locked") return "locked";
          return "archived";
        });
      }
    });
  };

  return (
    <div>
      <p>Status: {status}</p>
      {(status === "loading" || isPending) && (
        <div data-testid="loading-spinner" />
      )}
      <button onClick={handleArchive}>Archive Campaign</button>
    </div>
  );
}

describe("Market Intelligence & Race Conditions Intent Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('handles the "snapshot beats the fetch" race condition gracefully', async () => {
    // 1. Mock the HTTP mutation with a massive delay
    server.use(
      http.post("/api/campaigns/camp-123/archive", async () => {
        await delay(1000); // Artificially hold the HTTP response
        return HttpResponse.json({ success: true });
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MockCampaignDashboard campaignId="camp-123" />);

    expect(screen.getByText(/Status: active/i)).toBeInTheDocument();

    // 3. User triggers the mutation
    const archiveButton = screen.getByRole("button", {
      name: /archive campaign/i,
    });
    await user.click(archiveButton);

    // Assert optimistic/loading UI is present
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    // THE RACE: Simulate the backend updating Firestore BEFORE the HTTP responds
    act(() => {
      window.dispatchEvent(
        new CustomEvent("mock-snapshot", {
          detail: { id: "camp-123", status: "archived" },
        }),
      );
    });

    // 5. Assert the UI reflects the snapshot data immediately, despite the pending fetch
    expect(screen.getByText(/Status: archived/i)).toBeInTheDocument();

    // 6. Assert that after the fetch finally resolves, the UI doesn't revert to a stale state
    await act(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
    });

    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    expect(screen.getByText(/Status: archived/i)).toBeInTheDocument();
  });

  it("React 19 useTransition safely handles concurrent snapshot interruptions", async () => {
    server.use(
      http.post("/api/campaigns/camp-123/archive", async () => {
        await delay(800);
        return HttpResponse.json({ success: true });
      }),
    );

    // We use the same Mock to test useTransition interruptions
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MockCampaignDashboard campaignId="camp-123" />);

    expect(screen.getByText(/Status: active/i)).toBeInTheDocument();

    // Trigger the React 19 transition
    const archiveButton = screen.getByRole("button", {
      name: /archive campaign/i,
    });
    await user.click(archiveButton);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    // THE INTERRUPTION: urgent WebSocket update arrives
    act(() => {
      window.dispatchEvent(
        new CustomEvent("mock-snapshot", {
          detail: { id: "camp-123", status: "locked" },
        }),
      );
    });

    // Assert the urgent snapshot update is applied IMMEDIATELY to the DOM
    expect(screen.getByText(/Status: locked/i)).toBeInTheDocument();

    // Assert behavior once the delayed transition finally resolves.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    // The snapshot truth must remain intact
    expect(screen.getByText(/Status: locked/i)).toBeInTheDocument();
  });

  it("Graceful Degradation: AbortController cancellation degrades gracefully to partial data instead of a fatal Error Boundary", async () => {
    // We simulate a streaming partial data UI
    function MockStreamingComponent() {
      const [data, setData] = React.useState<string[]>([]);
      const [error, setError] = React.useState<string | null>(null);
      const abortControllerRef = React.useRef<AbortController | null>(null);

      const startStream = async () => {
        abortControllerRef.current = new AbortController();
        try {
          // Simulate chunked streaming
          setData(["Chunk 1"]);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              setData((prev) => [...prev, "Chunk 2"]);
              resolve(true);
            }, 1000);
            abortControllerRef.current!.signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new DOMException("AbortError", "AbortError"));
            });
          });
        } catch (e: any) {
          if (e.name === "AbortError") {
            setError("Analysis Paused");
          } else {
            throw e; // Fatal error boundary
          }
        }
      };

      return (
        <div>
          {data.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
          {error && <div role="alert">{error}</div>}
          <button onClick={startStream}>Start Analysis</button>
          <button onClick={() => abortControllerRef.current?.abort()}>
            Cancel Analysis
          </button>
        </div>
      );
    }

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MockStreamingComponent />);

    await user.click(screen.getByRole("button", { name: /start analysis/i }));

    // Partial data arrives
    expect(screen.getByText("Chunk 1")).toBeInTheDocument();

    // User cancels mid-stream
    await user.click(screen.getByRole("button", { name: /cancel analysis/i }));

    // Does not throw fatal error, shows partial data + Paused state
    expect(screen.getByText("Chunk 1")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Analysis Paused");

    // Chunk 2 never arrives
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.queryByText("Chunk 2")).not.toBeInTheDocument();
  });

  it("Explainable States: UI cycles through explainable loading states and maintains accessibility context without generic spinners", async () => {
    // We simulate a component that has an explainable loading state
    function MockExplainableArena() {
      const [step, setStep] = React.useState(0);
      const [isPending, startTransition] = React.useTransition();

      const runArena = () => {
        startTransition(() => {
          setStep(1);
          setTimeout(() => setStep(2), 3000);
          setTimeout(() => setStep(3), 6000);
          setTimeout(() => setStep(4), 9000);
        });
      };

      const messages = [
        "Idle",
        "Scanning competitor landscape...",
        "Analyzing market gaps...",
        "Finalizing niche viability report...",
        "Done",
      ];

      return (
        <div>
          <button onClick={runArena}>Start Validation</button>
          {step > 0 && step < 4 && (
            <div
              role="region"
              aria-label="Validation Progress"
              aria-busy="true"
            >
              <p>{messages[step]}</p>
              <div
                data-testid="sr-announcer"
                aria-live="polite"
                className="sr-only"
              >
                {messages[step]}
              </div>
            </div>
          )}
          {step === 4 && <div role="status">Success</div>}
        </div>
      );
    }

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<MockExplainableArena />);

    await user.click(screen.getByRole("button", { name: /start validation/i }));

    // FAILING BAD PATTERNS: Assert generic spinner does NOT exist
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    const loadingRegion = screen.getByRole("region", {
      name: /validation progress/i,
    });
    expect(loadingRegion).toHaveAttribute("aria-busy", "true");

    const liveRegion = screen.getByTestId("sr-announcer");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");

    expect(
      screen.getAllByText(/scanning competitor landscape.../i)[0],
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(
      screen.getAllByText(/analyzing market gaps.../i)[0],
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(
      screen.getAllByText(/finalizing niche viability report.../i)[0],
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Success");
  });
});
