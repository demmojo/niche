import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PQLGateModal } from "../PQLGateModal";

vi.mock("../AuthDialogProvider", () => ({
  useAuthDialogDispatch: vi.fn(() => ({ openModal: vi.fn() })),
}));

describe("PQLGateModal", () => {
  it("renders a Radix dialog portal when open", () => {
    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Unlock the Vault")).toBeInTheDocument();
  });
});
