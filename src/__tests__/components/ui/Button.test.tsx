import { render, screen, waitFor, fireEvent } from "../../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../../../components/ui/Button";
import React from "react";

describe("Button component", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: /Click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).not.toHaveAttribute("aria-disabled");
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
    const user = userEvent.setup();
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
});
