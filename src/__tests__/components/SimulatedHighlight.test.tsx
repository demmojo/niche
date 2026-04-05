import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SimulatedHighlight } from "../../components/SimulatedHighlight";

describe("SimulatedHighlight", () => {
  it("renders the text and handles highlight click", async () => {
    const onHighlight = vi.fn();
    const text = "This is a key insight that users love.";

    render(
      <SimulatedHighlight
        text={text}
        onHighlight={onHighlight}
        isHighlighted={false}
      />,
    );

    const highlightableSpan = screen.getByText(text);
    expect(highlightableSpan).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(highlightableSpan);

    expect(onHighlight).toHaveBeenCalledTimes(1);
    expect(onHighlight).toHaveBeenCalledWith(text);
  });

  it("applies highlighted styles when isHighlighted is true", () => {
    const text = "A crucial metric.";

    render(<SimulatedHighlight text={text} isHighlighted={true} />);

    const span = screen.getByText(text);
    // Check for some highlighted class, like bg-amber-200
    expect(span.className).toMatch(/bg-amber-200/);
  });
});
