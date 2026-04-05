import { render, screen } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PQLGateModal } from "../../components/PQLGateModal";
import * as usePQLUpgradeModule from "../../hooks/usePQLUpgrade";

vi.mock("../../hooks/usePQLUpgrade", () => ({
  usePQLUpgrade: vi.fn(() => ({
    upgradeAccount: vi.fn(),
    upgradeState: "STATE_IDLE",
    isPending: false,
    error: null,
  })),
}));

describe("PQLGateModal", () => {
  it("does not render when isOpen is false", () => {
    vi.mocked(usePQLUpgradeModule.usePQLUpgrade).mockReturnValue({
      upgradeAccount: vi.fn(),
      upgradeState: "STATE_IDLE",
      isPending: false,
      error: null,
    });

    render(<PQLGateModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Save Your Analysis")).not.toBeInTheDocument();
  });

  it("renders correctly and triggers upgrade", async () => {
    const upgradeMock = vi.fn();
    vi.mocked(usePQLUpgradeModule.usePQLUpgrade).mockReturnValue({
      upgradeAccount: upgradeMock,
      upgradeState: "STATE_IDLE",
      isPending: false,
      error: null,
    });

    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Unlock the Vault")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(upgradeMock).toHaveBeenCalled();
  });

  it("shows error and pending state", () => {
    vi.mocked(usePQLUpgradeModule.usePQLUpgrade).mockReturnValue({
      upgradeAccount: vi.fn(),
      upgradeState: "STATE_MERGING",
      isPending: true,
      error: "Upgrade failed",
    });

    render(<PQLGateModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Upgrade failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlocking..." })).toBeDisabled();
  });
});
