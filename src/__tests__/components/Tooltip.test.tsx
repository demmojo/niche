import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tMessage } from "../../content/dictionary";
import { Tooltip } from "../../components/Tooltip";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className }: any) => (
      <div className={className} data-testid="tooltip-content">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Tooltip Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children without tooltip initially", () => {
    render(
      <Tooltip content={tMessage("Tooltip text")}>
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });

  it("shows tooltip on mouse enter after delay", async () => {
    render(
      <Tooltip content={tMessage("Tooltip text")} delay={300}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const buttonContainer = screen.getByText("Hover me").parentElement!;
    fireEvent.mouseEnter(buttonContainer);

    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    render(
      <Tooltip content={tMessage("Tooltip text")} delay={300}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const buttonContainer = screen.getByText("Hover me").parentElement!;

    // Enter and trigger
    fireEvent.mouseEnter(buttonContainer);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();

    // Leave
    fireEvent.mouseLeave(buttonContainer);
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });

  it("clears timeout if mouse leaves before delay", () => {
    render(
      <Tooltip content={tMessage("Tooltip text")} delay={300}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const buttonContainer = screen.getByText("Hover me").parentElement!;

    // Enter
    fireEvent.mouseEnter(buttonContainer);

    // Leave immediately
    fireEvent.mouseLeave(buttonContainer);

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should never show
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });

  it("applies correct position classes", () => {
    const { unmount } = render(
      <Tooltip content={tMessage("Tooltip text")} delay={0} position="bottom">
        <button>Hover me</button>
      </Tooltip>,
    );

    const buttonContainer = screen.getByText("Hover me").parentElement!;
    fireEvent.mouseEnter(buttonContainer);
    act(() => vi.advanceTimersByTime(1));

    expect(screen.getByTestId("tooltip-content")).toHaveClass("top-full mt-2");
    unmount();

    // Test left
    render(
      <Tooltip content={tMessage("Tooltip text")} delay={0} position="left">
        <button>Left</button>
      </Tooltip>,
    );
    const leftContainer = screen.getByText("Left").parentElement!;
    fireEvent.mouseEnter(leftContainer);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getAllByTestId("tooltip-content")[0]).toHaveClass(
      "right-full mr-2",
    );

    // Test right
    render(
      <Tooltip content={tMessage("Tooltip text")} delay={0} position="right">
        <button>Right</button>
      </Tooltip>,
    );
    const rightContainer = screen.getByText("Right").parentElement!;
    fireEvent.mouseEnter(rightContainer);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getAllByTestId("tooltip-content")[1]).toHaveClass(
      "left-full ml-2",
    );
  });
});
