import React from "react";
import { render, screen, fireEvent } from "../../test-utils/render";
import { describe, it, expect, vi } from "vitest";
import { LimitReachedModal } from "../../components/LimitReachedModal";

describe("LimitReachedModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <LimitReachedModal
        isOpen={false}
        onClose={vi.fn()}
        onRequestIncrease={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly when isOpen is true", () => {
    render(
      <LimitReachedModal
        isOpen={true}
        onClose={vi.fn()}
        onRequestIncrease={vi.fn()}
      />,
    );
    expect(screen.getByText("Alpha Limit Reached")).toBeInTheDocument();
  });

  it("calls onClose and onRequestIncrease when contact button is clicked", () => {
    const onClose = vi.fn();
    const onRequestIncrease = vi.fn();
    render(
      <LimitReachedModal
        isOpen={true}
        onClose={onClose}
        onRequestIncrease={onRequestIncrease}
      />,
    );

    fireEvent.click(screen.getByText("Contact Us to Increase Limits"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequestIncrease).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when understand button is clicked", () => {
    const onClose = vi.fn();
    const onRequestIncrease = vi.fn();
    render(
      <LimitReachedModal
        isOpen={true}
        onClose={onClose}
        onRequestIncrease={onRequestIncrease}
      />,
    );

    fireEvent.click(screen.getByText("Okay, I understand"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequestIncrease).not.toHaveBeenCalled();
  });
});
