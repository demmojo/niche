import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TarpitWarningModal } from "../../components/TarpitWarningModal";

describe("TarpitWarningModal", () => {
  const mockCompetitors = Array(50).fill({
    name: "Competitor",
    trueCompetitorScore: 0.9,
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onPivot: vi.fn(),
    competitors: mockCompetitors,
    scoreResult: {
      status: "success",
      isTarpit: true,
    },
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <TarpitWarningModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the initial warning screen", () => {
    render(<TarpitWarningModal {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "Tarpit Warning" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Based on deep validation of 50 competitors/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /VIEW 3 LUCRATIVE SUB-NICHES/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /I accept the high failure risk/i }),
    ).toBeInTheDocument();
  });

  it("calls onClose when proceed button is clicked", async () => {
    const user = userEvent.setup();
    render(<TarpitWarningModal {...defaultProps} />);
    const proceedBtn = screen.getByRole("button", {
      name: /I accept the high failure risk/i,
    });
    await user.click(proceedBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows evolution diff when primary button is clicked", async () => {
    const user = userEvent.setup();
    render(<TarpitWarningModal {...defaultProps} />);
    const viewNichesBtn = screen.getByRole("button", {
      name: /VIEW 3 LUCRATIVE SUB-NICHES/i,
    });
    await user.click(viewNichesBtn);

    // Check for evolution diff content
    expect(
      screen.getByRole("heading", { name: "Evolution Diff" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hard Mode (Tarpit)")).toBeInTheDocument();
    expect(screen.getByText("Easy Mode (Niche)")).toBeInTheDocument();
  });

  it("can navigate back to warning from evolution diff", async () => {
    const user = userEvent.setup();
    render(<TarpitWarningModal {...defaultProps} />);
    const viewNichesBtn = screen.getByRole("button", {
      name: /VIEW 3 LUCRATIVE SUB-NICHES/i,
    });
    await user.click(viewNichesBtn);

    const backBtn = screen.getByRole("button", { name: "BACK TO WARNING" });
    await user.click(backBtn);

    expect(
      screen.getByRole("heading", { name: "Tarpit Warning" }),
    ).toBeInTheDocument();
  });

  it("calls onPivot when pivot button is clicked from diff view", async () => {
    const user = userEvent.setup();
    render(<TarpitWarningModal {...defaultProps} />);
    const viewNichesBtn = screen.getByRole("button", {
      name: /VIEW 3 LUCRATIVE SUB-NICHES/i,
    });
    await user.click(viewNichesBtn);

    const pivotBtn = screen.getByRole("button", { name: /Pivot to Niche/i });
    await user.click(pivotBtn);

    expect(defaultProps.onPivot).toHaveBeenCalled();
  });

  it("defaults to success status when scoreResult is not provided", () => {
    const propsWithoutScore = { ...defaultProps };
    delete propsWithoutScore.scoreResult;
    render(<TarpitWarningModal {...propsWithoutScore} />);
    expect(
      screen.getByRole("heading", { name: "Tarpit Warning" }),
    ).toBeInTheDocument();
  });

  it("renders Data Desert state", () => {
    render(
      <TarpitWarningModal
        {...defaultProps}
        scoreResult={{ status: "data_desert" }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Data Desert" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ACKNOWLEDGE & CLOSE" }),
    ).toBeInTheDocument();
  });

  it("renders Partial Score state", () => {
    render(
      <TarpitWarningModal
        {...defaultProps}
        scoreResult={{ status: "partial_data", uniqueness: 0.5 }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Partial Score" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "PROCEED WITH PARTIAL DATA" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Uniqueness Score: 0.50")).toBeInTheDocument();
  });

  it("renders Raw Market Signal state", () => {
    render(
      <TarpitWarningModal
        {...defaultProps}
        scoreResult={{ status: "error", error: "Failed to parse API" }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Raw Market Signal" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to parse API")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DISMISS" })).toBeInTheDocument();
  });

  it("renders custom message when provided", () => {
    render(
      <TarpitWarningModal
        {...defaultProps}
        scoreResult={{
          status: "success",
          isTarpit: true,
          message: "Custom tarpit warning message",
        }}
      />,
    );
    expect(
      screen.getByText("Note: Custom tarpit warning message"),
    ).toBeInTheDocument();
  });

  it("renders competitor extraction exact quote and link", () => {
    const competitorsWithExtraction = [
      {
        name: "Competitor 1",
        extraction: {
          exact_quote: "We are the best generic CRM.",
          exa_url: "https://competitor.com",
        },
      },
    ];
    render(
      <TarpitWarningModal
        {...defaultProps}
        competitors={competitorsWithExtraction}
      />,
    );
    expect(
      screen.getByText('"We are the best generic CRM."'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Verify Source/i }),
    ).toHaveAttribute("href", "https://competitor.com");
  });

  it("renders competitor extraction without link", () => {
    const competitorsWithExtraction = [
      {
        name: "Competitor 1",
        extraction: {
          exact_quote: "Another generic tool without a link.",
        },
      },
    ];
    render(
      <TarpitWarningModal
        {...defaultProps}
        competitors={competitorsWithExtraction}
      />,
    );
    expect(
      screen.getByText('"Another generic tool without a link."'),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Verify Source/i })).toBeNull();
  });
});
