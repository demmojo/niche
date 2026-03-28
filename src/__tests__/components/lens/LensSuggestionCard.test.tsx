import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../../test-utils/render";
import { LensSuggestionCard } from "../../../components/lens/LensSuggestionCard";
import { LensSuggestion } from "../../../types";

const mockSuggestion: LensSuggestion = {
  id: "test-sugg-1",
  type: "feature",
  title: "Test Feature",
  description: "A cool test feature",
  rationale: "Because we need tests",
  confidence: "High",
};

describe("LensSuggestionCard", () => {
  it("renders the suggestion content correctly", () => {
    const handleApprove = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <LensSuggestionCard
        suggestion={mockSuggestion}
        onApprove={handleApprove}
        onDismiss={handleDismiss}
      />,
    );

    expect(screen.getByText("Test Feature")).toBeInTheDocument();
    expect(screen.getByText("A cool test feature")).toBeInTheDocument();
    expect(screen.getByText("Because we need tests")).toBeInTheDocument();
    expect(screen.getByText("High CONF")).toBeInTheDocument();
    expect(screen.getByText("TYPE: FEATURE")).toBeInTheDocument();
  });

  it("calls onApprove when the approve button is clicked", () => {
    const handleApprove = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <LensSuggestionCard
        suggestion={mockSuggestion}
        onApprove={handleApprove}
        onDismiss={handleDismiss}
      />,
    );

    const approveButton = screen.getByRole("button", {
      name: /APPROVE & ADD/i,
    });
    fireEvent.click(approveButton);

    expect(handleApprove).toHaveBeenCalledTimes(1);
    expect(handleApprove).toHaveBeenCalledWith(mockSuggestion);
  });

  it("shows dismissal reasons when DISMISS is clicked and calls onDismiss with the selected reason", () => {
    const handleApprove = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <LensSuggestionCard
        suggestion={mockSuggestion}
        onApprove={handleApprove}
        onDismiss={handleDismiss}
      />,
    );

    const dismissButton = screen.getByRole("button", { name: /DISMISS/i });
    fireEvent.click(dismissButton);

    expect(screen.getByText("REASON FOR DISMISSAL?")).toBeInTheDocument();
    expect(screen.queryByText("APPROVE & ADD")).not.toBeInTheDocument(); // Approve button should be gone

    const lowRoiButton = screen.getByRole("button", { name: /LOW ROI/i });
    fireEvent.click(lowRoiButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
    expect(handleDismiss).toHaveBeenCalledWith(mockSuggestion, "LOW ROI");
  });
});
