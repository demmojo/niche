// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HybridProductBuilder } from "../../../components/ideation/HybridProductBuilder";

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      "data-testid": testId,
      onClick,
      style,
      ...props
    }: any) => (
      <div
        data-testid={testId || "motion-div"}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </div>
    ),
  },
  useAnimation: () => ({
    start: vi.fn(),
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("HybridProductBuilder Component", () => {
  const mockFeatures = [
    {
      id: "1",
      title: "Feature 1",
      cost: 10,
      source: "Competitor A",
      isGap: false,
    },
    {
      id: "2",
      title: "Feature 2",
      cost: 12,
      source: "Competitor B",
      isGap: false,
    },
    {
      id: "3",
      title: "Feature 3",
      cost: 15,
      source: "Competitor C",
      isGap: false,
    },
  ];

  const onFinishMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with features", () => {
    render(
      <HybridProductBuilder features={mockFeatures} onFinish={onFinishMock} />,
    );
    expect(screen.getByText("Feature 1")).toBeInTheDocument();
    expect(screen.getByText("Find a Niche")).toBeInTheDocument();
  });

  it("handles swiping right to accept feature", async () => {
    const user = userEvent.setup();
    render(
      <HybridProductBuilder features={mockFeatures} onFinish={onFinishMock} />,
    );

    // Accept first feature
    const acceptButtons = screen.getAllByRole("button");
    const acceptBtn = acceptButtons.find((btn) =>
      btn.className.includes("text-emerald-500"),
    );

    await user.click(acceptBtn!);

    // Should now show feature 2
    expect(screen.getByText("Feature 2")).toBeInTheDocument();
    expect(screen.queryByText("Feature 1")).not.toBeInTheDocument();
  });

  it("handles swiping left to reject feature", async () => {
    const user = userEvent.setup();
    render(
      <HybridProductBuilder features={mockFeatures} onFinish={onFinishMock} />,
    );

    // Reject first feature
    const rejectButtons = screen.getAllByRole("button");
    const rejectBtn = rejectButtons.find((btn) =>
      btn.className.includes("text-rose-500"),
    );

    await user.click(rejectBtn!);

    // Should now show feature 2 without adding to budget
    expect(screen.getByText("Feature 2")).toBeInTheDocument();
  });

  it("shows warning when budget is exceeded", async () => {
    const user = userEvent.setup();
    const expensiveFeatures = [
      { id: "1", title: "Feature 1", cost: 20, source: "C", isGap: false },
      { id: "2", title: "Feature 2", cost: 15, source: "C", isGap: false },
    ];
    render(
      <HybridProductBuilder
        features={expensiveFeatures}
        onFinish={onFinishMock}
      />,
    );

    const acceptButtons = screen.getAllByRole("button");
    const acceptBtn = acceptButtons.find((btn) =>
      btn.className.includes("text-emerald-500"),
    );

    await user.click(acceptBtn!); // 20 cost added
    await user.click(acceptBtn!); // 15 cost, exceeds 30

    expect(screen.getByText("Tarpit Warning")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", {
      name: /Back to Drawing Board/i,
    });
    await user.click(backBtn);

    expect(screen.queryByText("Tarpit Warning")).not.toBeInTheDocument();
  });

  it("completes flow and calls onFinish when deck is empty", async () => {
    const user = userEvent.setup();
    render(
      <HybridProductBuilder
        features={[mockFeatures[0]]}
        onFinish={onFinishMock}
      />,
    );

    const acceptButtons = screen.getAllByRole("button");
    const acceptBtn = acceptButtons.find((btn) =>
      btn.className.includes("text-emerald-500"),
    );

    await user.click(acceptBtn!);

    expect(screen.getByText("MVP Selected")).toBeInTheDocument();

    const generateBtn = screen.getByRole("button", {
      name: /Generate Product Spec/i,
    });
    await user.click(generateBtn);

    expect(onFinishMock).toHaveBeenCalledWith([mockFeatures[0]]);
  });

  it("adds gap features when clicking Find a Niche", async () => {
    const user = userEvent.setup();
    render(
      <HybridProductBuilder features={mockFeatures} onFinish={onFinishMock} />,
    );

    const findNicheBtn = screen.getByRole("button", { name: /Find a Niche/i });
    await user.click(findNicheBtn);

    // Gap feature should be top of deck
    expect(
      screen.getByText("HIPAA Compliant Local Hosting"),
    ).toBeInTheDocument();
  });
});
