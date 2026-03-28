import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../../test-utils/render";
import LensStrategyConsole from "../../../components/lens/LensStrategyConsole";
import {
  runLensDeepAnalysis,
  generateLensChatResponse,
} from "../../../services/lensAiService";

// Mock the AI service
vi.mock("../../../services/lensAiService", () => ({
  runLensDeepAnalysis: vi.fn(),
  generateLensChatResponse: vi.fn(),
}));

const mockStats = {
  tracked: 0,
  new: 0,
  actionable: 0,
  alerts: 0,
  pricingChanges: 0,
  featuresIndexed: 0,
  topIntegrations: "None",
};
const mockCompetitors: any[] = [];
const mockInsights: any[] = [];
const mockRawData: any[] = [];

describe("LensStrategyConsole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initialization error when no data is provided", async () => {
    render(
      <LensStrategyConsole
        stats={mockStats}
        competitors={mockCompetitors}
        insights={mockInsights}
        rawData={mockRawData}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Initialization sequence complete\. No market data synchronization detected/i,
        ),
      ).toBeInTheDocument();
    });

    expect(runLensDeepAnalysis).not.toHaveBeenCalled();
  });

  it("runs deep analysis automatically on mount when data is available", async () => {
    const mockedRunAnalysis = vi.mocked(runLensDeepAnalysis);
    mockedRunAnalysis.mockResolvedValueOnce({
      message: "Deep analysis complete. I have some suggestions.",
      suggestions: [
        {
          type: "feature",
          title: "New AI Tool",
          description: "Add an AI tool.",
          rationale: "Good idea",
          confidence: "High",
        },
      ],
      options: ["Tell me more"],
    });

    render(
      <LensStrategyConsole
        stats={{ ...mockStats, tracked: 1 }} // Has data
        competitors={[{ id: "comp-1" } as any]}
        insights={mockInsights}
        rawData={mockRawData}
      />,
    );

    // Initial typing state might show
    expect(screen.getByText(/Analyzing Market Data.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(runLensDeepAnalysis).toHaveBeenCalledTimes(1);
    });

    // Verify chat message appears
    await waitFor(() => {
      expect(
        screen.getByText("Deep analysis complete. I have some suggestions."),
      ).toBeInTheDocument();
    });

    // Verify option appears
    expect(screen.getByText("Tell me more")).toBeInTheDocument();
  });

  it("handles user selecting an option and calling generateLensChatResponse", async () => {
    const mockedRunAnalysis = vi.mocked(runLensDeepAnalysis);
    mockedRunAnalysis.mockResolvedValueOnce({
      message: "Initial analysis.",
      suggestions: [],
      options: ["Ask a question"],
    });

    const mockedChatResponse = vi.mocked(generateLensChatResponse);
    mockedChatResponse.mockResolvedValueOnce({
      message: "Here is your answer.",
      suggestions: [],
      options: ["Thanks"],
    });

    render(
      <LensStrategyConsole
        stats={{ ...mockStats, tracked: 1 }}
        competitors={[{ id: "comp-1" } as any]}
        insights={mockInsights}
        rawData={mockRawData}
      />,
    );

    // Wait for initial analysis to complete
    await waitFor(() => {
      expect(screen.getByText("Ask a question")).toBeInTheDocument();
    });

    // Click the option
    fireEvent.click(screen.getByText("Ask a question"));

    // User message should appear
    expect(screen.getByText("Ask a question")).toBeInTheDocument();

    await waitFor(() => {
      expect(generateLensChatResponse).toHaveBeenCalledTimes(1);
    });

    // Verify lens response
    await waitFor(() => {
      expect(screen.getByText("Here is your answer.")).toBeInTheDocument();
      expect(screen.getByText("Thanks")).toBeInTheDocument();
    });
  });

  it("calls onAddFeature when a feature suggestion is approved", async () => {
    const mockedRunAnalysis = vi.mocked(runLensDeepAnalysis);
    mockedRunAnalysis.mockResolvedValueOnce({
      message: "Analysis with feature.",
      suggestions: [
        {
          type: "feature",
          title: "Feature X",
          description: "Desc X",
          rationale: "Rationale X",
          confidence: "High",
        },
      ],
      options: [],
    });

    const onAddFeature = vi.fn();

    render(
      <LensStrategyConsole
        stats={{ ...mockStats, tracked: 1 }}
        competitors={[{ id: "comp-1" } as any]}
        insights={mockInsights}
        rawData={mockRawData}
        onAddFeature={onAddFeature}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Feature X")).toBeInTheDocument();
    });

    const approveButton = screen.getByRole("button", {
      name: /APPROVE & ADD/i,
    });
    fireEvent.click(approveButton);

    expect(onAddFeature).toHaveBeenCalledTimes(1);
    expect(onAddFeature).toHaveBeenCalledWith("Feature X", "Desc X");
  });

  it("removes the suggestion when dismissed", async () => {
    const mockedRunAnalysis = vi.mocked(runLensDeepAnalysis);
    mockedRunAnalysis.mockResolvedValueOnce({
      message: "Analysis with feature.",
      suggestions: [
        {
          type: "feature",
          title: "Feature To Dismiss",
          description: "Desc",
          rationale: "Rat",
          confidence: "High",
        },
      ],
      options: [],
    });

    render(
      <LensStrategyConsole
        stats={{ ...mockStats, tracked: 1 }}
        competitors={[{ id: "comp-1" } as any]}
        insights={mockInsights}
        rawData={mockRawData}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Feature To Dismiss")).toBeInTheDocument();
    });

    const dismissButton = screen.getByRole("button", { name: /DISMISS/i });
    fireEvent.click(dismissButton);

    const outOfScopeButton = screen.getByRole("button", {
      name: /OUT OF SCOPE/i,
    });
    fireEvent.click(outOfScopeButton);

    // The suggestion should disappear
    await waitFor(() => {
      expect(screen.queryByText("Feature To Dismiss")).not.toBeInTheDocument();
    });
  });
});
