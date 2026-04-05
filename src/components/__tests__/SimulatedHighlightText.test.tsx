import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SimulatedHighlightText } from "../SimulatedHighlightText";

describe("SimulatedHighlightText", () => {
  it("splits text into sentences and allows highlighting", () => {
    const onHighlight = vi.fn();
    render(
      <SimulatedHighlightText
        text="This is sentence one. This is sentence two!"
        onHighlight={onHighlight}
      />,
    );

    const sentences = screen.getAllByRole("button");
    expect(sentences).toHaveLength(2);

    fireEvent.click(sentences[0]);
    expect(onHighlight).toHaveBeenCalledWith("This is sentence one.");
  });
});
