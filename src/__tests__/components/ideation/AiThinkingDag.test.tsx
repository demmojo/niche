import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AiThinkingDag } from "../../../../src/components/ideation/AiThinkingDag";
import { act } from "react";

// Make a Mock Event Source that we can control
class MockEventSource {
  url: string;
  listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
    (globalThis as any).__mockEventSource = this;
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    }
  }

  close() {}

  // Helper to trigger events
  trigger(eventName: string, data: any) {
    if (this.listeners[eventName]) {
      const eventObj = { data: JSON.stringify(data) };
      this.listeners[eventName].forEach((cb) => cb(eventObj));
    }
  }
}

describe("AiThinkingDag", () => {
  beforeEach(() => {
    vi.stubGlobal("EventSource", MockEventSource);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders initial nodes correctly", () => {
    const onComplete = vi.fn();
    render(
      <AiThinkingDag
        jobId="test-job"
        competitorsCount={3}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByText(/AI Thinking DAG/i)).toBeInTheDocument();
    expect(screen.getByText(/test-job/i)).toBeInTheDocument();

    expect(screen.getByText("Ingesting Competitors")).toBeInTheDocument();
    expect(screen.getByText("Extracting Visual Features")).toBeInTheDocument();
    expect(screen.getByText("Synthesizing Hybrid Product")).toBeInTheDocument();
  });

  it("updates node progress when receiving progress events", async () => {
    const onComplete = vi.fn();
    render(
      <AiThinkingDag
        jobId="test-job"
        competitorsCount={3}
        onComplete={onComplete}
      />,
    );

    const es = (globalThis as any).__mockEventSource as MockEventSource;

    act(() => {
      es.trigger("progress", { jobId: "scrape-123", progress: 45 });
    });

    expect(screen.getByText("45% Complete...")).toBeInTheDocument();
  });

  it("advances through the DAG flow automatically after network-io completes", async () => {
    const onComplete = vi.fn();
    render(
      <AiThinkingDag
        jobId="test-job"
        competitorsCount={3}
        onComplete={onComplete}
      />,
    );

    const es = (globalThis as any).__mockEventSource as MockEventSource;

    act(() => {
      es.trigger("completed", { jobId: "scrape-123" });
    });

    // We have a chain of setTimeouts in the component:
    // 1000ms -> set vision-ml to 50%
    // +2000ms -> set vision-ml to 100%
    // +1000ms -> set synthesize to 100%
    // +1000ms -> call onComplete

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("50% Complete...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it("shows failure state when a job fails", async () => {
    const onComplete = vi.fn();
    render(
      <AiThinkingDag
        jobId="test-job"
        competitorsCount={3}
        onComplete={onComplete}
      />,
    );

    const es = (globalThis as any).__mockEventSource as MockEventSource;

    act(() => {
      es.trigger("failed", {
        jobId: "vision-123",
        error: "Failed to extract vision",
      });
    });

    expect(screen.getByText("Failed to extract vision")).toBeInTheDocument();
  });
});
