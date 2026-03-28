import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConsolidateFeaturesModal } from "../../components/ConsolidateFeaturesModal";
import { withKeyRotation } from "../../utils/geminiClient";

// Mock dependencies
vi.mock("lucide-react", () => ({
  X: () => <div data-testid="icon-x" />,
  Combine: () => <div data-testid="icon-combine" />,
  Loader2: () => <div data-testid="icon-loader2" />,
  Check: () => <div data-testid="icon-check" />,
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@google/genai", () => ({
  Type: {
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    STRING: "STRING",
  },
}));

vi.mock("../../utils/geminiClient", () => ({
  withKeyRotation: vi.fn(),
}));

// Mock Tooltip to just render its children to avoid testing tooltip internals
vi.mock("../../components/Tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ConsolidateFeaturesModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConsolidate = vi.fn();

  const mockCompetitors = [
    {
      id: "comp-1",
      name: "Competitor A",
      coreFeatures: ["Chatbot", "Basic Analytics", "Other Feature"],
    },
    {
      id: "comp-2",
      name: "Competitor B",
      coreFeatures: ["Conversational AI", "Advanced Analytics"],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.alert
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ConsolidateFeaturesModal
        isOpen={false}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when isOpen is true", () => {
    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );
    expect(screen.getByText("Aggregate Capabilities")).toBeInTheDocument();
    expect(screen.getByText("Ready to Aggregate")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start Analysis/i }),
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );

    // There are two buttons that call onClose initially: the X icon button and the Cancel button.
    // The X icon is inside the tooltip mock. It doesn't have text, but we can find it by its testid.
    const closeButtons = screen.getAllByRole("button");
    // The first one is the X button
    fireEvent.click(closeButtons[0]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles feature analysis successfully and displays suggestions", async () => {
    const mockApiResponse = {
      text: JSON.stringify({
        consolidations: [
          {
            originalFeatures: ["Chatbot", "Conversational AI"],
            suggestedName: "AI Chat",
            reasoning: "Both refer to conversational interfaces.",
          },
          {
            originalFeatures: ["Basic Analytics", "Advanced Analytics"],
            suggestedName: "Analytics",
            reasoning: "Combine into a general analytics capability.",
          },
        ],
      }),
    };

    (withKeyRotation as any).mockImplementation(async (callback: any) => {
      const mockAi = {
        models: {
          generateContent: vi.fn().mockResolvedValue(mockApiResponse),
        },
      };
      return callback(mockAi, "mock-model");
    });

    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );

    const startBtn = screen.getByRole("button", { name: /Start Analysis/i });
    fireEvent.click(startBtn);

    // Should show loading state
    expect(screen.getByText("Analyzing Features...")).toBeInTheDocument();
    expect(screen.getByTestId("icon-loader2")).toBeInTheDocument();

    // Wait for AI response to be processed and rendered
    await waitFor(() => {
      expect(screen.getByText("Analysis Complete")).toBeInTheDocument();
    });

    // Check if suggestions are rendered
    expect(screen.getByText("AI Chat")).toBeInTheDocument();
    expect(
      screen.getByText("Both refer to conversational interfaces."),
    ).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();

    // Check if original features are shown as line-through
    expect(screen.getByText("Chatbot")).toBeInTheDocument();
    expect(screen.getByText("Conversational AI")).toBeInTheDocument();
  });

  it("handles empty analysis results correctly", async () => {
    const mockApiResponse = {
      text: JSON.stringify({ consolidations: [] }),
    };

    (withKeyRotation as any).mockImplementation(async (callback: any) => {
      const mockAi = {
        models: {
          generateContent: vi.fn().mockResolvedValue(mockApiResponse),
        },
      };
      return callback(mockAi, "mock-model");
    });

    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Start Analysis/i }));

    await waitFor(() => {
      expect(screen.getByText("No aggregations needed")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /Apply Aggregations/i }),
    ).not.toBeInTheDocument();
  });

  it("handles analysis error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (withKeyRotation as any).mockRejectedValue(new Error("API failed"));

    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Start Analysis/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to analyze features. Please try again.",
      );
    });

    // Should revert back to initial state (ready to aggregate)
    expect(screen.getByText("Ready to Aggregate")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("applies aggregations correctly and calls onConsolidate", async () => {
    const mockApiResponse = {
      text: JSON.stringify({
        consolidations: [
          {
            originalFeatures: ["Chatbot", "Conversational AI"],
            suggestedName: "AI Chat",
            reasoning: "Both refer to conversational interfaces.",
          },
        ],
      }),
    };

    (withKeyRotation as any).mockImplementation(async (callback: any) => {
      const mockAi = {
        models: {
          generateContent: vi.fn().mockResolvedValue(mockApiResponse),
        },
      };
      return callback(mockAi, "mock-model");
    });

    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={mockCompetitors}
        onConsolidate={mockOnConsolidate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Start Analysis/i }));

    await waitFor(() => {
      expect(screen.getByText("Analysis Complete")).toBeInTheDocument();
    });

    // Click apply button
    const applyBtn = screen.getByRole("button", {
      name: /Apply Aggregations/i,
    });
    fireEvent.click(applyBtn);

    // Wait for the final updates to be sent to onConsolidate
    await waitFor(() => {
      expect(mockOnConsolidate).toHaveBeenCalledTimes(1);
    });

    // Verify the updates payload
    const updates = mockOnConsolidate.mock.calls[0][0];
    expect(updates).toHaveLength(2);

    // Competitor A: 'Chatbot' -> 'AI Chat', 'Basic Analytics', 'Other Feature'
    const compA = updates.find((u: any) => u.competitorId === "comp-1");
    expect(compA.newFeatures).toContain("AI Chat");
    expect(compA.newFeatures).not.toContain("Chatbot");
    expect(compA.newFeatures).toContain("Basic Analytics");

    // Competitor B: 'Conversational AI' -> 'AI Chat', 'Advanced Analytics'
    const compB = updates.find((u: any) => u.competitorId === "comp-2");
    expect(compB.newFeatures).toContain("AI Chat");
    expect(compB.newFeatures).not.toContain("Conversational AI");
    expect(compB.newFeatures).toContain("Advanced Analytics");

    // Verify onClose is called after applying
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not add duplicate consolidated features if multiple original features match", async () => {
    const mockApiResponse = {
      text: JSON.stringify({
        consolidations: [
          {
            originalFeatures: ["Feature 1", "Feature 2"],
            suggestedName: "Combined Feature",
            reasoning: "Merge them.",
          },
        ],
      }),
    };

    (withKeyRotation as any).mockImplementation(async (callback: any) => {
      const mockAi = {
        models: {
          generateContent: vi.fn().mockResolvedValue(mockApiResponse),
        },
      };
      return callback(mockAi, "mock-model");
    });

    const compsWithDupes = [
      {
        id: "comp-1",
        name: "Competitor A",
        coreFeatures: ["Feature 1", "Feature 2", "Other"], // Has both features!
      },
    ];

    render(
      <ConsolidateFeaturesModal
        isOpen={true}
        onClose={mockOnClose}
        competitors={compsWithDupes}
        onConsolidate={mockOnConsolidate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Start Analysis/i }));

    await waitFor(() => {
      expect(screen.getByText("Analysis Complete")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Apply Aggregations/i }),
    );

    await waitFor(() => {
      expect(mockOnConsolidate).toHaveBeenCalledTimes(1);
    });

    const updates = mockOnConsolidate.mock.calls[0][0];
    const compA = updates.find((u: any) => u.competitorId === "comp-1");

    // 'Combined Feature' should only appear once
    const combinedCount = compA.newFeatures.filter(
      (f: string) => f === "Combined Feature",
    ).length;
    expect(combinedCount).toBe(1);
    expect(compA.newFeatures).not.toContain("Feature 1");
    expect(compA.newFeatures).not.toContain("Feature 2");
    expect(compA.newFeatures).toContain("Other");
  });
});
