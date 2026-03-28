import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ComputeMeter } from "../../components/ComputeMeter";

describe("ComputeMeter", () => {
  it("renders critical state correctly (0 credits)", () => {
    const { container } = render(<ComputeMeter credits={0} />);

    // Check text
    expect(screen.getByText("0")).toBeInTheDocument();

    // Check classes for critical state
    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv).toHaveClass("border-rose-500/30");
    expect(parentDiv).toHaveClass("bg-rose-500/10");
    expect(parentDiv).toHaveClass("text-rose-600");
  });

  it("renders low state correctly (1-5 credits)", () => {
    const { container } = render(<ComputeMeter credits={5} />);

    // Check text
    expect(screen.getByText("5")).toBeInTheDocument();

    // Check classes for low state
    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv).toHaveClass("border-orange-500/30");
    expect(parentDiv).toHaveClass("bg-orange-500/10");
    expect(parentDiv).toHaveClass("text-orange-600");
  });

  it("renders normal state correctly (>5 credits)", () => {
    const { container } = render(<ComputeMeter credits={50} />);

    // Check text
    expect(screen.getByText("50")).toBeInTheDocument();

    // Check classes for normal state
    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv).toHaveClass("border-slate-200");
    expect(parentDiv).toHaveClass("bg-white");
    expect(parentDiv).toHaveClass("text-slate-600");
  });
});
