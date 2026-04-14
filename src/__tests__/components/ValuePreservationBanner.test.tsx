import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ValuePreservationBanner } from "../../components/ui/ValuePreservationBanner";

describe("ValuePreservationBanner", () => {
  it("renders correctly and handles click", () => {
    const onSave = vi.fn();
    render(<ValuePreservationBanner onSave={onSave} />);

    expect(screen.getByText(/Secure Your Workspace/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This is a temporary workspace/i),
    ).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: /save workspace/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables button when streaming", () => {
    const onSave = vi.fn();
    render(<ValuePreservationBanner onSave={onSave} isStreaming={true} />);

    const btn = screen.getByRole("button", { name: /save workspace/i });
    expect(btn).toBeDisabled();
    // In our Button component, we use aria-disabled or native disabled.
    // If we use native disabled, it will be caught by toBeDisabled().
  });
});
