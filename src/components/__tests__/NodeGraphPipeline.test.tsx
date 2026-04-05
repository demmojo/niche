import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeGraphPipeline } from "../NodeGraphPipeline";

describe("NodeGraphPipeline", () => {
  it("renders pre-gate locked state with blur and grayscale", () => {
    render(<NodeGraphPipeline isLocked={true} />);
    const container = screen.getByTestId("node-graph-container");
    expect(container).toHaveClass("blur-sm");
    expect(container).toHaveClass("grayscale");
    expect(screen.getByTestId("lock-overlay")).toBeInTheDocument();
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
    expect(approveBtn).toHaveClass("bg-[#E3FF00]");
  });
});
