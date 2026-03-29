import { render, screen } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PQLGateModal } from "../../components/PQLGateModal";
import * as usePQLUpgradeModule from "../../hooks/usePQLUpgrade";

vi.mock("../../hooks/usePQLUpgrade", () => ({
  usePQLUpgrade: vi.fn(() => ({
    upgradeAccount: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

describe("PQLGateModal", () => {
  it("does not render when isOpen is false", () => {
    vi.mocked(usePQLUpgradeModule.usePQLUpgrade).mockReturnValue({
      upgradeAccount: vi.fn(),
      isPending: false,
      error: null,
    });

    render(<PQLGateModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Unlock Full Features")).not.toBeInTheDocument();
  });

  it("renders correctly and triggers upgrade", async () => {
    const upgradeMock = vi.fn();
    vi.mocked(usePQLUpgradeModule.usePQLUpgrade).mockReturnValue({
      upgradeAccount: upgradeMock,
      isPending: false,
      error: null,
    });

    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Unlock Full Features")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(upgradeMock).toHaveBeenCalled();
  });

  it("shows error and pending state", () => {
    vi.mocked(usePQLUpgradeModule.usePQLUpgrade).mockReturnValue({
      upgradeAccount: vi.fn(),
      isPending: true,
      error: "Upgrade failed",
    });

    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Upgrade failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrading..." })).toBeDisabled();
  });
});
