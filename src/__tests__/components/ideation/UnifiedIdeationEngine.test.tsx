import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UnifiedIdeationEngine } from "../../../../src/components/ideation/UnifiedIdeationEngine";

// Mock the EventSource for AiThinkingDag
/**
 *
 */
class MockEventSource {
  onmessage: any = null;
  addEventListener = vi.fn();
  close = vi.fn();
  constructor(url: string) {
    // console.log("MockEventSource created with url", url);
  }
}

describe("UnifiedIdeationEngine", () => {
  beforeEach(() => {
    vi.stubGlobal("EventSource", MockEventSource);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the IntentRouter initially", () => {
    render(<UnifiedIdeationEngine />);
    expect(
      screen.getByText(/How would you like to begin\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/I have a specific idea/i)).toBeInTheDocument();
    expect(
      screen.getByText(/I want to brainstorm a new idea/i),
    ).toBeInTheDocument();
  });

  it("transitions to CompetitorIngestion when 'idea' is selected", async () => {
    render(<UnifiedIdeationEngine />);
    const ideaButton = screen.getByText(/I have a specific idea/i);
    fireEvent.click(ideaButton);

    await waitFor(() => {
      expect(screen.getByText(/Identify Your Targets/i)).toBeInTheDocument();
    });
  });

  it("transitions to CompetitorIngestion when 'brainstorm' is selected", async () => {
    render(<UnifiedIdeationEngine />);
    const brainstormButton = screen.getByText(
      /I want to brainstorm a new idea/i,
    );
    fireEvent.click(brainstormButton);

    await waitFor(() => {
      expect(screen.getByText(/Identify Your Targets/i)).toBeInTheDocument();
    });
  });

  it("submits competitors and transitions to AiThinkingDag", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      /**
       *
       */
      json: async () => ({ jobId: "mock-job-123" }),
    });

    render(<UnifiedIdeationEngine />);

    // Go to ingestion phase
    fireEvent.click(screen.getByText(/I want to brainstorm a new idea/i));

    await waitFor(() => {
      expect(screen.getByText(/Identify Your Targets/i)).toBeInTheDocument();
    });

    // Add a competitor URL
    const input = screen.getByPlaceholderText(
      /e.g. https:\/\/www.salesforce.com/i,
    );
    const addButton = screen.getByText(/Add/i, { selector: "button" });

    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(addButton);

    // Start Analysis
    const startButton = screen.getByText(/Start Analysis/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ideation/start",
        expect.any(Object),
      );
      // Should now be in 'thinking' phase which shows AiThinkingDag
      expect(screen.getByText(/AI Thinking DAG/i)).toBeInTheDocument();
      expect(screen.getByText(/mock-job-123/i)).toBeInTheDocument();
    });
  });

  it("handles fetch failure when starting ingestion", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      /**
       *
       */
      json: async () => ({ error: "Failed to start job" }),
    });

    render(<UnifiedIdeationEngine />);

    fireEvent.click(screen.getByText(/I want to brainstorm a new idea/i));

    await waitFor(() => {
      expect(screen.getByText(/Identify Your Targets/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      /e.g. https:\/\/www.salesforce.com/i,
    );
    const addButton = screen.getByText(/Add/i, { selector: "button" });

    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(addButton);

    const startButton = screen.getByText(/Start Analysis/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Failed to start job");
      // Should remain in 'ingestion' phase
      expect(screen.getByText(/Identify Your Targets/i)).toBeInTheDocument();
    });
  });
});
