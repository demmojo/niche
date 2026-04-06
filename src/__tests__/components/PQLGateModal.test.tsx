import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PQLGateModal } from "../../components/PQLGateModal";
import * as AuthDialogProvider from "../../components/AuthDialogProvider";

vi.mock("../../components/AuthDialogProvider", () => ({
  useAuthDialogDispatch: vi.fn(() => ({ openModal: vi.fn() })),
}));

describe("PQLGateModal", () => {
  it("renders correctly when open", () => {
    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Unlock the Vault")).toBeInTheDocument();
    expect(
      screen.getByText(/You've curated a strong, data-backed niche/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue with Google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Discard analysis/i }),
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<PQLGateModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Unlock the Vault")).not.toBeInTheDocument();
  });

  it("calls onClose and openModal when Continue with Google is clicked", async () => {
    const mockOnClose = vi.fn();
    const mockOpenModal = vi.fn();
    (AuthDialogProvider.useAuthDialogDispatch as any).mockReturnValue({
      openModal: mockOpenModal,
    });

    render(<PQLGateModal isOpen={true} onClose={mockOnClose} />);

    const continueBtn = screen.getByRole("button", {
      name: /Continue with Google/i,
    });
    fireEvent.click(continueBtn);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOpenModal).toHaveBeenCalled();
  });
});
