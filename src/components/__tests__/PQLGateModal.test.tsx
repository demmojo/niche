import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PQLGateModal } from "../PQLGateModal";

vi.mock("../hooks/usePQLUpgrade", () => ({
  usePQLUpgrade: () => ({
    upgradeAccount: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

describe("PQLGateModal", () => {
  it("renders a Radix dialog portal when open", () => {
    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Unlock the Vault")).toBeInTheDocument();
  });
});
