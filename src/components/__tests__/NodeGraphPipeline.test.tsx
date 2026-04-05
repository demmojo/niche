import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeGraphPipeline } from "../NodeGraphPipeline";

describe("NodeGraphPipeline", () => {
  it("renders Phase 01 freely but locks Phase 02 when reached", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<NodeGraphPipeline isLocked={true} />);

    // Phase 1 is not blurred
    const container = screen.getByTestId("node-graph-container");
    expect(container).not.toHaveClass("blur-md");

    // Lock overlay is not shown initially
    expect(screen.queryByTestId("lock-overlay")).not.toBeInTheDocument();

    // Click Approve to advance to Phase 02
    await user.click(screen.getByRole("button", { name: "Approve" }));

    // Now lock overlay should appear
    expect(await screen.findByTestId("lock-overlay")).toBeInTheDocument();
  });

  it("renders post-gate unlocked state with Acid Yellow buttons", () => {
    render(<NodeGraphPipeline isLocked={false} />);
    const container = screen.getByTestId("node-graph-container");
    expect(container).not.toHaveClass("blur-sm");
    expect(container).not.toHaveClass("grayscale");
    expect(screen.queryByTestId("lock-overlay")).not.toBeInTheDocument();

    // Check for Ghost Node
    expect(
      screen.getByText(/The AI breaks features into atomic phases/i),
    ).toBeInTheDocument();

    // Check for Approve button
    const approveBtn = screen.getByText("Approve");
    expect(approveBtn).toHaveClass("bg-ink-dark");
  });

  it("transitions to MASTER state when Approve is clicked", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<NodeGraphPipeline isLocked={false} />);

    expect(
      screen.getByText(/The AI breaks features into atomic phases/i),
    ).toBeInTheDocument();

    const approveBtn = screen.getByText("Approve");
    await user.click(approveBtn);

    // After approval, the NOVICE text should disappear
    expect(
      screen.queryByText(/The AI breaks features into atomic phases/i),
    ).not.toBeInTheDocument();
  });

  it("handles Revise button logic", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<NodeGraphPipeline isLocked={false} />);

    const reviseBtn = screen.getByText("Revise");
    expect(reviseBtn).toBeDisabled();

    const input = screen.getByPlaceholderText(/Ask the AI to revise/i);
    await user.type(input, "Change email to username");

    expect(reviseBtn).not.toBeDisabled();

    await user.click(reviseBtn);

    // Check loading state immediately after click
    expect(screen.getByText("Revising...")).toBeInTheDocument();
    expect(input).toBeDisabled();

    // Use waitFor to wait for the transition to finish
    const { waitFor } = await import("@testing-library/react");
    await waitFor(
      () => {
        expect(input).toHaveValue("");
        expect(
          screen.getByRole("button", { name: "Revise" }),
        ).toBeInTheDocument();
      },
      { timeout: 3500 },
    );
  });
});
