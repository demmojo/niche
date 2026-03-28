import React from "react";
import { render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { tMessage } from "../../content/dictionary";
import { GuidedTour } from "../../components/GuidedTour";

describe("GuidedTour Component", () => {
  const mockSteps = [
    {
      target: ".step-1",
      title: tMessage("Step 1"),
      content: tMessage("This is step 1"),
      placement: "bottom" as const,
    },
    {
      target: ".step-2",
      title: tMessage("Step 2"),
      content: tMessage("This is step 2"),
      placement: "top" as const,
    },
  ];

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <GuidedTour
        steps={mockSteps}
        isOpen={false}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders step 1 and navigates to step 2 and completes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onComplete = vi.fn();

    // Mock document.querySelector to return a fake element with getBoundingClientRect
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockImplementation((selector: string) => {
      if (selector === ".step-1" || selector === ".step-2") {
        const el = document.createElement("div");
        /**
         *
         */
        el.getBoundingClientRect = () => ({
          top: 100,
          left: 100,
          right: 200,
          bottom: 200,
          width: 100,
          height: 100,
          x: 100,
          y: 100,
          /**
           *
           */
          toJSON: () => {},
        });
        return el;
      }
      return null;
    });

    render(
      <GuidedTour
        steps={mockSteps}
        isOpen={true}
        onClose={onClose}
        onComplete={onComplete}
      />,
    );

    // Initial state: Step 1
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("This is step 1")).toBeInTheDocument();

    // Click Next
    let nextBtn = screen.getByRole("button", { name: /Next/i });
    await user.click(nextBtn);

    // State: Step 2
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("This is step 2")).toBeInTheDocument();

    // Click Back (it's the chevron left button, we can find it by querying buttons and picking the one before Next/Finish)
    // Actually the back button doesn't have text. Let's find it by its disabled/enabled state or svg.
    const buttons = screen.getAllByRole("button");
    // buttons[0] is close, buttons[1] is back, buttons[2] is next/finish
    await user.click(buttons[1]);

    // State: Step 1
    expect(screen.getByText("Step 1")).toBeInTheDocument();

    // Go next again
    nextBtn = screen.getByRole("button", { name: /Next/i });
    await user.click(nextBtn);

    // Click Finish
    const finishBtn = screen.getByRole("button", { name: /Finish/i });
    await user.click(finishBtn);

    expect(onComplete).toHaveBeenCalled();

    document.querySelector = originalQuerySelector;
  });

  it("closes when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onComplete = vi.fn();

    render(
      <GuidedTour
        steps={mockSteps}
        isOpen={true}
        onClose={onClose}
        onComplete={onComplete}
      />,
    );

    const closeBtns = screen.getAllByRole("button");
    // The close button is the one with the X icon, usually the first button
    await user.click(closeBtns[0]);

    expect(onClose).toHaveBeenCalled();
  });
});
