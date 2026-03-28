import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MarketAnalysis from "../../components/MarketAnalysis";
import * as geminiClient from "../../utils/geminiClient";

// --- MOCKS PER USER REQUIREMENTS ---

// 1. Mock Firebase dependencies & useFirebaseSync (as requested, even if unused in the current component version)
vi.mock("firebase/app", () => ({ initializeApp: vi.fn() }));
vi.mock("firebase/firestore", () => ({ getFirestore: vi.fn() }));
vi.mock("firebase/auth", () => ({ getAuth: vi.fn() }));
vi.mock("../../hooks/useFirebaseSync", () => ({
  default: () => ({ syncData: vi.fn(), isSyncing: false }),
  useFirebaseSync: (key: string, initialValue: any) => {
    const React = require("react");
    const [val, setVal] = React.useState(initialValue);
    return [val, setVal];
  },
}));

// 2. Mock lucide-react
vi.mock("lucide-react", () => ({
  Mailbox: () => <div data-testid="icon-mailbox" />,
  Coffee: () => <div data-testid="icon-coffee" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Newspaper: () => <div data-testid="icon-newspaper" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Award: () => <div data-testid="icon-award" />,
  Mail: () => <div data-testid="icon-mail" />,
  Table: () => <div data-testid="icon-table" />,
  LayoutGrid: () => <div data-testid="icon-layout-grid" />,
  CheckSquare: () => <div data-testid="icon-check-square" />,
  Square: () => <div data-testid="icon-square" />,
  Save: () => <div data-testid="icon-save" />,
  Edit2: () => <div data-testid="icon-edit2" />,
}));

// 3. Mock motion/react for AnimatePresence & motion
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// 4. Mock react-markdown
vi.mock("react-markdown", () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

// 5. Mock Tooltip
vi.mock("../../components/Tooltip", () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

vi.mock("../../utils/geminiClient", () => ({
  withKeyRotation: vi.fn().mockImplementation(async (callback) => {
    const dummyAi = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            strengths: ["Strong AI pipeline"],
            weaknesses: ["New to market"],
            opportunities: ["Rapid growth"],
            threats: ["Established competitors"],
          }),
        }),
      },
    };
    return callback(dummyAi, "test-model");
  }),
}));

// Mock scrollIntoView
HTMLElement.prototype.scrollIntoView = vi.fn();

const mockKeyRotation = (resolvesToText: any) => async (callback: any) => {
  const dummyAi = {
    models: {
      generateContent: vi
        .fn()
        .mockResolvedValue({ text: JSON.stringify(resolvesToText) }),
    },
  };
  return callback(dummyAi, "test-model");
};
const mockKeyRotationReject = (error: Error) => async (callback: any) => {
  const dummyAi = {
    models: { generateContent: vi.fn().mockRejectedValue(error) },
  };
  return callback(dummyAi, "test-model");
};
describe("MarketAnalysis Component", () => {
  const defaultProps = {
    stats: {
      tracked: 5,
      topIntegrations: "Slack, Jira",
      pricingChanges: "None",
      featuresIndexed: 100,
    },
    competitors: [
      { name: "CompA", coreFeatures: ["Feat1", "Feat2"] },
      { name: "CompB", features: "FeatX" },
    ],
    insights: [{ title: "Insight 1", sourceIds: ["1"] }],
    rawData: [{ excerpt: "Raw 1", id: "r1" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and initiates conversation with Burt", async () => {
    (geminiClient.withKeyRotation as any).mockImplementationOnce(
      mockKeyRotation({
        message: "Hello. The melon is exquisite today.",
        options: ["Yes", "No"],
      }),
    );

    render(<MarketAnalysis {...defaultProps} />);

    expect(screen.getByText("Market Analysis")).toBeInTheDocument();
    expect(
      screen.getByText("Archivist Burt // Status: Reading..."),
    ).toBeInTheDocument();

    // Verify loading/typing state is temporarily shown
    expect(screen.getByText("_")).toBeInTheDocument();

    // Wait for the conversation to start
    await waitFor(
      () => {
        expect(
          screen.getByText("Hello. The melon is exquisite today."),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Options should be rendered
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("handles option click and continues the conversation", async () => {
    (geminiClient.withKeyRotation as any)
      .mockImplementationOnce(
        mockKeyRotation({
          message: "Initial message",
          options: ["Option 1"],
        }),
      )
      .mockImplementationOnce(
        mockKeyRotation({
          message: "I see. Very astute.",
          options: ["Continue"],
        }),
      );

    render(<MarketAnalysis {...defaultProps} />);

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Click option
    fireEvent.click(screen.getByText("Option 1"));

    // User message should appear
    expect(screen.getByText("Option 1")).toBeInTheDocument();

    // Wait for response
    await waitFor(
      () => {
        expect(screen.getByText("I see. Very astute.")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it('grants "Refined Reflexes" achievement for quick response', async () => {
    (geminiClient.withKeyRotation as any)
      .mockImplementationOnce(
        mockKeyRotation({ message: "Init", options: ["Quick Option"] }),
      )
      .mockImplementationOnce(
        mockKeyRotation({ message: "Response", options: [] }),
      );

    render(<MarketAnalysis {...defaultProps} />);

    await waitFor(
      () => {
        expect(screen.getByText("Quick Option")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Click immediately (< 3000ms)
    fireEvent.click(screen.getByText("Quick Option"));

    await waitFor(
      () => {
        expect(screen.getByText("Refined Reflexes")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("handles connection error gracefully during initial load", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (geminiClient.withKeyRotation as any).mockImplementationOnce(
      mockKeyRotationReject(new Error("Network anomaly")),
    );

    render(<MarketAnalysis {...defaultProps} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Praise Kier/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText("Retry connection")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("handles connection error gracefully during conversation", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (geminiClient.withKeyRotation as any)
      .mockImplementationOnce(
        mockKeyRotation({ message: "Init", options: ["Reply"] }),
      )
      .mockRejectedValueOnce(new Error("Silence requested"));

    render(<MarketAnalysis {...defaultProps} />);

    await waitFor(
      () => {
        expect(screen.getByText("Reply")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByText("Reply"));

    await waitFor(
      () => {
        expect(
          screen.getByText("The board has requested a moment of silence."),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText("Acknowledge")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("opens mailbox and fetches mail", async () => {
    (geminiClient.withKeyRotation as any)
      .mockImplementationOnce(mockKeyRotation({ message: "Init", options: [] }))
      .mockImplementationOnce(
        mockKeyRotation({
          title: "The Kier Chronicle",
          date: "Today",
          content: "No news is good news.",
        }),
      );

    render(<MarketAnalysis {...defaultProps} />);

    // Click mail button
    const mailBtn = screen.getByTestId("icon-mail").parentElement!;
    fireEvent.click(mailBtn);

    // Initial loading state inside mailbox
    expect(
      screen.getByText("Retrieving missives from the Board..."),
    ).toBeInTheDocument();

    // Mail content loads
    await waitFor(
      () => {
        expect(screen.getByText("The Kier Chronicle")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Close mailbox
    fireEvent.click(screen.getByText("[ CLOSE ]"));
    expect(screen.queryByText("The Kier Chronicle")).not.toBeInTheDocument();
  });

  describe("Market Data Grid and SWOT Features", () => {
    beforeEach(() => {
      (geminiClient.withKeyRotation as any).mockImplementation(
        mockKeyRotation({
          message: "Hello",
          options: [],
        }),
      );
    });

    it("tests the rendering of competitor data in a sortable table", async () => {
      render(<MarketAnalysis {...defaultProps} />);

      await waitFor(() => {
        expect(geminiClient.withKeyRotation).toHaveBeenCalled();
      });

      // Click 'Data & SWOT' tab
      fireEvent.click(screen.getByText("Data & SWOT"));

      // Table should be rendered
      expect(screen.getByText("Competitor Data")).toBeInTheDocument();

      // Competitor names should be present
      expect(screen.getByText("CompA")).toBeInTheDocument();
      expect(screen.getByText("CompB")).toBeInTheDocument();

      // Sort by score
      const scoreHeader = screen.getByText("Score");
      fireEvent.click(scoreHeader); // Sort score asc

      const diffHeader = screen.getByText("Differentiation");
      fireEvent.click(diffHeader); // asc
      fireEvent.click(diffHeader); // desc

      fireEvent.click(screen.getByText("Name"));
      fireEvent.click(screen.getByText("Website"));
      fireEvent.click(screen.getByText("Features"));
    });

    it("tests toggling columns", async () => {
      render(<MarketAnalysis {...defaultProps} />);

      await waitFor(() => {
        expect(geminiClient.withKeyRotation).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText("Data & SWOT"));

      // Name column should exist
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toBeInTheDocument();

      // Toggle Name column off
      const nameCheckbox = screen.getByLabelText("name");
      fireEvent.click(nameCheckbox);

      // Name column should not be visible
      expect(
        screen.queryByRole("columnheader", { name: "Name" }),
      ).not.toBeInTheDocument();
    });

    it("tests editing cells in the competitor table", async () => {
      render(<MarketAnalysis {...defaultProps} />);

      await waitFor(() => {
        expect(geminiClient.withKeyRotation).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText("Data & SWOT"));

      // Find CompA's name cell and click it to edit
      const compACell = screen.getByText("CompA");
      fireEvent.click(compACell);

      // Input should appear
      let input = screen.getByDisplayValue("CompA");
      fireEvent.change(input, { target: { value: "CompA-Edited" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      // Cell should update
      expect(screen.getByText("CompA-Edited")).toBeInTheDocument();

      // Find features cell
      const featureCell = screen.getByText("Feat1, Feat2"); // CompA has ['Feat1', 'Feat2'] for features/coreFeatures in defaultProps
      fireEvent.click(featureCell);

      // Change features
      let fInput = screen.getByDisplayValue("Feat1, Feat2");
      fireEvent.change(fInput, { target: { value: "Feat3" } });
      fireEvent.keyDown(fInput, { key: "Enter", code: "Enter" });

      expect(screen.getByText("Feat3")).toBeInTheDocument();
    });

    it("tests the SWOT analysis generation", async () => {
      // First call is for the initial chat on mount
      (geminiClient.withKeyRotation as any)
        .mockImplementationOnce(async (cb: any) => {
          return cb(
            {
              models: {
                generateContent: vi.fn().mockResolvedValue({
                  text: JSON.stringify({ message: "Hello", options: [] }),
                }),
              },
            },
            "test-model",
          );
        })
        // Second call is for the SWOT generation
        .mockImplementationOnce(async (cb: any) => {
          return cb(
            {
              models: {
                generateContent: vi.fn().mockResolvedValue({
                  text: JSON.stringify({
                    strengths: ["Strong AI pipeline"],
                    weaknesses: ["New to market"],
                    opportunities: ["Rapid growth"],
                    threats: ["Established competitors"],
                  }),
                }),
              },
            },
            "test-model",
          );
        });

      render(<MarketAnalysis {...defaultProps} />);

      await waitFor(() => {
        expect(geminiClient.withKeyRotation).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText("Data & SWOT"));

      const generateBtn = screen.getByText("Generate Auto-SWOT");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText("Strong AI pipeline")).toBeInTheDocument();
        expect(screen.getByText("New to market")).toBeInTheDocument();
        expect(screen.getByText("Rapid growth")).toBeInTheDocument();
        expect(screen.getByText("Established competitors")).toBeInTheDocument();
      });
    });

    it("tests saving data (mocking useFirebaseSync)", async () => {
      // Testing blur to save, and verifying our useFirebaseSync mock retains state
      render(<MarketAnalysis {...defaultProps} />);

      await waitFor(() => {
        expect(geminiClient.withKeyRotation).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText("Data & SWOT"));

      const compBCell = screen.getByText("CompB");
      fireEvent.click(compBCell);

      const input = screen.getByDisplayValue("CompB");
      fireEvent.change(input, { target: { value: "CompB-Saved" } });
      fireEvent.blur(input); // blur also saves

      expect(screen.getByText("CompB-Saved")).toBeInTheDocument();
    });
    it("handles failure when generating SWOT", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (geminiClient.withKeyRotation as any)
        .mockImplementationOnce(async (cb: any) => {
          return cb(
            {
              models: {
                generateContent: vi.fn().mockResolvedValue({
                  text: JSON.stringify({ message: "Hello", options: [] }),
                }),
              },
            },
            "test-model",
          );
        })
        .mockImplementationOnce(async (cb: any) => {
          throw new Error("SWOT failure");
        });

      render(<MarketAnalysis {...defaultProps} />);

      await waitFor(() => {
        expect(geminiClient.withKeyRotation).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText("Data & SWOT"));
      fireEvent.click(
        screen.getByRole("button", { name: /Generate Auto-SWOT/i }),
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to generate SWOT:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
