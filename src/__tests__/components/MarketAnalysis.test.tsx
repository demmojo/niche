import React from "react";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MarketAnalysis from "../../components/MarketAnalysis";
import { server } from "../../test-utils/server";
import { http, HttpResponse } from "msw";

vi.mock("firebase/app", () => ({ initializeApp: vi.fn() }));
vi.mock("firebase/firestore", () => ({ getFirestore: vi.fn() }));
vi.mock("firebase/auth", () => ({ getAuth: vi.fn() }));
vi.mock("../../hooks/useFirebaseSync", () => ({
  default: () => ({ syncData: vi.fn(), isSyncing: false }),
  useFirebaseSync: (key, initialValue) => {
    const React = require("react");
    const [val, setVal] = React.useState(initialValue);
    return [val, setVal];
  },
}));

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

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("react-markdown", () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock("../../components/Tooltip", () => ({
  Tooltip: ({ children, content }) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

HTMLElement.prototype.scrollIntoView = vi.fn();

const mockKeyRotation = (resolvesToText) => {
  server.use(
    http.post(
      "https://generativelanguage.googleapis.com/*",
      () => {
        return HttpResponse.json({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(resolvesToText) }] } },
          ],
        });
      },
      { once: true },
    ),
  );
};
const mockKeyRotationReject = () => {
  server.use(
    http.post(
      "https://generativelanguage.googleapis.com/*",
      () => {
        return HttpResponse.error();
      },
      { once: true },
    ),
  );
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
    mockKeyRotation({
      message: "Hello. The melon is exquisite today.",
      options: ["Yes", "No"],
    });
    render(<MarketAnalysis {...defaultProps} />);

    expect(screen.getByText("Market Analysis")).toBeInTheDocument();
    expect(
      screen.getByText("Archivist Burt // Status: Reading..."),
    ).toBeInTheDocument();
    expect(screen.getByText("_")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(
          screen.getByText("Hello. The melon is exquisite today."),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("handles option click and continues the conversation", async () => {
    server.use(
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: "Initial message",
                        options: ["Option 1"],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: "I see. Very astute.",
                        options: ["Continue"],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
    );

    render(<MarketAnalysis {...defaultProps} />);

    await waitFor(
      () => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    fireEvent.click(screen.getByText("Option 1"));
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByText("I see. Very astute.")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it('grants "Refined Reflexes" achievement for quick response', async () => {
    server.use(
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: "Init",
                        options: ["Quick Option"],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: "Response",
                        options: [],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
    );

    render(<MarketAnalysis {...defaultProps} />);
    await waitFor(
      () => {
        expect(screen.getByText("Quick Option")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
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
    mockKeyRotationReject();
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
    server.use(
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: "Init",
                        options: ["Reply"],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
      http.post("https://generativelanguage.googleapis.com/*", () => {
        return HttpResponse.error();
      }),
    );

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
    server.use(
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    { text: JSON.stringify({ message: "Init", options: [] }) },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
      http.post(
        "https://generativelanguage.googleapis.com/*",
        () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        title: "The Kier Chronicle",
                        date: "Today",
                        content: "No news is good news.",
                      }),
                    },
                  ],
                },
              },
            ],
          });
        },
        { once: true },
      ),
    );

    render(<MarketAnalysis {...defaultProps} />);
    const mailBtn = screen.getByTestId("icon-mail").parentElement;
    fireEvent.click(mailBtn);
    expect(
      screen.getByText("Retrieving missives from the Board..."),
    ).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByText("The Kier Chronicle")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    fireEvent.click(screen.getByText("[ CLOSE ]"));
    expect(screen.queryByText("The Kier Chronicle")).not.toBeInTheDocument();
  });

  describe("Market Data Grid and SWOT Features", () => {
    beforeEach(() => {
      mockKeyRotation({ message: "Hello", options: [] });
    });

    it("tests the rendering of competitor data in a sortable table", async () => {
      render(<MarketAnalysis {...defaultProps} />);
      fireEvent.click(screen.getByText("Data & SWOT"));
      expect(screen.getByText("Competitor Data")).toBeInTheDocument();
      expect(screen.getByText("CompA")).toBeInTheDocument();
      expect(screen.getByText("CompB")).toBeInTheDocument();

      const scoreHeader = screen.getByText("Score");
      fireEvent.click(scoreHeader);
      const diffHeader = screen.getByText("Differentiation");
      fireEvent.click(diffHeader);
      fireEvent.click(diffHeader);
      fireEvent.click(screen.getByText("Name"));
      fireEvent.click(screen.getByText("Website"));
      fireEvent.click(screen.getByText("Features"));
    });

    it("tests toggling columns", async () => {
      render(<MarketAnalysis {...defaultProps} />);
      fireEvent.click(screen.getByText("Data & SWOT"));
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toBeInTheDocument();
      const nameCheckbox = screen.getByLabelText("name");
      fireEvent.click(nameCheckbox);
      expect(
        screen.queryByRole("columnheader", { name: "Name" }),
      ).not.toBeInTheDocument();
    });

    it("tests editing cells in the competitor table", async () => {
      render(<MarketAnalysis {...defaultProps} />);
      fireEvent.click(screen.getByText("Data & SWOT"));
      const compACell = screen.getByText("CompA");
      fireEvent.click(compACell);
      let input = screen.getByDisplayValue("CompA");
      fireEvent.change(input, { target: { value: "CompA-Edited" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      expect(screen.getByText("CompA-Edited")).toBeInTheDocument();

      const featureCell = screen.getByText("Feat1, Feat2");
      fireEvent.click(featureCell);
      let fInput = screen.getByDisplayValue("Feat1, Feat2");
      fireEvent.change(fInput, { target: { value: "Feat3" } });
      fireEvent.keyDown(fInput, { key: "Enter", code: "Enter" });
      expect(screen.getByText("Feat3")).toBeInTheDocument();
    });

    it("tests the SWOT analysis generation", async () => {
      server.use(
        http.post(
          "https://generativelanguage.googleapis.com/*",
          () => {
            return HttpResponse.json({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({ message: "Hello", options: [] }),
                      },
                    ],
                  },
                },
              ],
            });
          },
          { once: true },
        ),
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        strengths: ["Strong AI pipeline"],
                        weaknesses: ["New to market"],
                        opportunities: ["Rapid growth"],
                        threats: ["Established competitors"],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }),
      );

      render(<MarketAnalysis {...defaultProps} />);
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
      render(<MarketAnalysis {...defaultProps} />);
      fireEvent.click(screen.getByText("Data & SWOT"));
      const compBCell = screen.getByText("CompB");
      fireEvent.click(compBCell);
      const input = screen.getByDisplayValue("CompB");
      fireEvent.change(input, { target: { value: "CompB-Saved" } });
      fireEvent.blur(input);
      expect(screen.getByText("CompB-Saved")).toBeInTheDocument();
    });

    it("handles failure when generating SWOT", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      server.use(
        http.post(
          "https://generativelanguage.googleapis.com/*",
          () => {
            return HttpResponse.json({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({ message: "Hello", options: [] }),
                      },
                    ],
                  },
                },
              ],
            });
          },
          { once: true },
        ),
        http.post("https://generativelanguage.googleapis.com/*", () => {
          return HttpResponse.error();
        }),
      );

      render(<MarketAnalysis {...defaultProps} />);
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
