import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiThinkingDag } from "../../../../src/components/ideation/AiThinkingDag";
import { act } from "react";
import * as firestore from "firebase/firestore";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(),
  };
});

vi.mock("../../../../src/firebase", () => ({
  db: {},
}));

describe("AiThinkingDag", () => {
  let snapshotCallback: Function;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(firestore.onSnapshot).mockImplementation((docRef, cb: any) => {
      snapshotCallback = cb;
      return vi.fn(); // return an unsubscribe function
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
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

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({ status: "processing", progress: 1, total: 3 }),
      });
    });

    expect(screen.getByText("33% Complete...")).toBeInTheDocument();
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

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          status: "completed",
          progress: 3,
          total: 3,
          results: [{ name: "foo" }],
        }),
      });
    });

    // We check that onComplete is called
    expect(onComplete).toHaveBeenCalledWith([{ name: "foo" }]);
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

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({ status: "failed", error: "Failed to extract vision" }),
      });
    });

    expect(
      screen.getAllByText("Failed to extract vision").length,
    ).toBeGreaterThan(0);
  });
});
