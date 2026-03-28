import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionFeed } from "../../components/SuggestionFeed";

const mockProductData = {
  name: "My App",
  description: "A great app",
  targetAudience: "Everyone",
  valueProposition: "It works",
  features: [],
};

const mockInsights = [
  {
    id: "i1",
    title: "Add AI Chat",
    description: "Users want AI chat",
    source: "Customer Interviews",
    relevanceScore: 95,
  },
  {
    id: "i2",
    title: "Export to PDF",
    description: "Useful for reporting",
    source: "Competitor Analysis",
    relevanceScore: 80,
  },
];

describe("SuggestionFeed", () => {
  it("does not render if no insights", () => {
    const onAccept = vi.fn();
    const { container } = render(
      <SuggestionFeed
        insights={[]}
        productData={mockProductData}
        onAccept={onAccept}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders insights", () => {
    const onAccept = vi.fn();
    render(
      <SuggestionFeed
        insights={mockInsights}
        productData={mockProductData}
        onAccept={onAccept}
      />,
    );

    expect(
      screen.getByText(/Market-Driven Feature Suggestions/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Add AI Chat")).toBeInTheDocument();
    expect(screen.getByText("Users want AI chat")).toBeInTheDocument();
    expect(screen.getByText("Export to PDF")).toBeInTheDocument();
    expect(screen.getByText("Useful for reporting")).toBeInTheDocument();
  });

  it("calls onAccept with correct arguments when Add button is clicked", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <SuggestionFeed
        insights={mockInsights}
        productData={mockProductData}
        onAccept={onAccept}
      />,
    );

    const addButtons = screen.getAllByRole("button", {
      name: /Add to Product/i,
    });
    expect(addButtons).toHaveLength(2);

    await user.click(addButtons[0]); // Click first insight's add button

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(
      "Add AI Chat",
      "Users want AI chat",
      "i1",
    );
  });
});
