import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AlphaBadge } from "../../components/AlphaBadge";

vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="icon-alert" />,
}));

describe("AlphaBadge Component", () => {
  it("renders correctly", () => {
    render(<AlphaBadge />);
    expect(screen.getByText("Early Alpha - Limits Apply")).toBeInTheDocument();
    expect(screen.getByTestId("icon-alert")).toBeInTheDocument();
    expect(
      screen.getByTitle("Daily API limits apply during Alpha"),
    ).toBeInTheDocument();
  });
});
