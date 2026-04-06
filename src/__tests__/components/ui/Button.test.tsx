import { render, screen, waitFor, fireEvent } from "../../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Button } from "../../../components/ui/Button";
import React from "react";
import * as ReactDOM from "react-dom";

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: vi.fn().mockReturnValue({ pending: false }),
  };
});

describe("Button component", () => {
  beforeEach(() => {
    vi.mocked(ReactDOM.useFormStatus).mockReturnValue({ pending: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: /Click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).not.toHaveAttribute("aria-disabled");
    expect(btn).toHaveClass("bg-ink-dark"); // primary
    expect(btn).toHaveClass("px-5"); // md
  });

  it("handles loading state internally when onClick returns a Promise", async () => {
    const user = userEvent.setup();
    let resolvePromise: any;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const handleClick = vi.fn().mockReturnValue(mockPromise);

    render(<Button onClick={handleClick}>Save</Button>);
    const btn = screen.getByRole("button", { name: /Save/i });

    // Click it
    await user.click(btn);

    // Should become loading
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise();

    // Should become non-loading
    await waitFor(() => {
      expect(btn).not.toHaveAttribute("aria-disabled");
    });
  });

  it("attaches refs correctly without forwardRef boilerplate", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("prevents double execution of onClick if already pending", async () => {
    let resolvePromise: any;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const handleClick = vi.fn().mockReturnValue(mockPromise);

    render(<Button onClick={handleClick}>Save</Button>);
    const btn = screen.getByRole("button", { name: /Save/i });

    // Double click synchronously using fireEvent to bypass RTL's await pointer events
    fireEvent.click(btn);
    fireEvent.click(btn);

    // Should only be called once because the first click sets internalIsPending
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise();
  });

  it("handles formPending automatically when type=submit", () => {
    vi.mocked(ReactDOM.useFormStatus).mockReturnValue({ pending: true });

    render(<Button type="submit">Submit Form</Button>);
    const btn = screen.getByRole("button");

    // It should be in pending state because form is pending AND type is submit
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("does not handle formPending automatically if type is not submit", () => {
    vi.mocked(ReactDOM.useFormStatus).mockReturnValue({ pending: true });

    render(<Button type="button">Not Submit Form</Button>);
    const btn = screen.getByRole("button", { name: /Not Submit Form/i });

    // It should NOT be in pending state because type is not submit
    expect(btn).not.toHaveAttribute("aria-disabled");
    expect(btn.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });

  it("handles disabled state correctly", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /Disabled Button/i });

    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn).toHaveClass("opacity-50 pointer-events-none");

    await user.click(btn);

    expect(handleClick).toHaveBeenCalledTimes(0);
  });

  it("allows controlled isPending state", () => {
    const handleClick = vi.fn();
    render(
      <Button isPending={true} onClick={handleClick}>
        Controlled Pending
      </Button>,
    );
    const btn = screen.getByRole("button");

    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders loading text correctly", () => {
    render(
      <Button isPending={true} loadingText="Please wait...">
        Loading Text
      </Button>,
    );
    expect(screen.getByText("Please wait...")).toBeInTheDocument();
    expect(screen.queryByText("Loading Text")).not.toBeInTheDocument();
  });

  it("executes synchronous onClick normally", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn(); // returns void
    render(<Button onClick={handleClick}>Sync Click</Button>);
    const btn = screen.getByRole("button", { name: /Sync Click/i });

    await user.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(btn).not.toHaveAttribute("aria-disabled");
  });

  it("resets internal pending state if onClick promise rejects", async () => {
    const error = new Error("Test error");
    const handleClick = vi.fn().mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Button onClick={handleClick}>Fail Click</Button>);
    const btn = screen.getByRole("button", { name: /Fail Click/i });

    fireEvent.click(btn);

    // Wait for the state to settle back to non-pending
    await waitFor(() => {
      expect(btn).not.toHaveAttribute("aria-disabled");
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Button onClick promise rejected:",
      error,
    );
    consoleSpy.mockRestore();
  });

  it("applies correct CSS classes for different variants and sizes", () => {
    const { rerender } = render(
      <Button variant="destructive" size="sm">
        Destructive
      </Button>,
    );
    let btn = screen.getByRole("button", { name: /Destructive/i });
    expect(btn).toHaveClass("bg-red-500");
    expect(btn).toHaveClass("px-3");

    rerender(
      <Button variant="ghost" size="lg">
        Ghost
      </Button>,
    );
    btn = screen.getByRole("button", { name: /Ghost/i });
    expect(btn).toHaveClass("bg-transparent");
    expect(btn).toHaveClass("px-6 w-full");

    rerender(
      <Button variant="outline" size="icon">
        Outline
      </Button>,
    );
    btn = screen.getByRole("button", { name: /Outline/i });
    expect(btn).toHaveClass("border-2");
    expect(btn).toHaveClass("p-2");

    rerender(<Button variant="secondary">Secondary</Button>);
    btn = screen.getByRole("button", { name: /Secondary/i });
    expect(btn).toHaveClass("bg-white text-ink-dark border border-ink-dark/20");
  });

  it("renders an icon correctly when not pending", () => {
    const MockIcon = () => <svg data-testid="mock-icon" />;
    const { rerender } = render(<Button icon={<MockIcon />}>With Icon</Button>);

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();

    // Ensure icon hides when pending
    rerender(
      <Button icon={<MockIcon />} isPending={true}>
        With Icon
      </Button>,
    );
    expect(screen.queryByTestId("mock-icon")).not.toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Button className="my-custom-class">Custom Class</Button>);
    const btn = screen.getByRole("button", { name: /Custom Class/i });
    expect(btn).toHaveClass("my-custom-class");
  });

  it("does not crash when clicked without onClick handler", async () => {
    const user = userEvent.setup();
    render(<Button>No Handler</Button>);
    const btn = screen.getByRole("button", { name: /No Handler/i });

    // Should not throw
    await user.click(btn);
  });
});
