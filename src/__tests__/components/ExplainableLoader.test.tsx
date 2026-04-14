import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExplainableLoader } from "../../components/ui/ExplainableLoader";

describe("ExplainableLoader", () => {
  it("returns null when IDLE", () => {
    const { container } = render(<ExplainableLoader state="IDLE" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the correct message for REQUESTING_GRANT", () => {
    render(<ExplainableLoader state="REQUESTING_GRANT" />);
    expect(screen.getByText("Securing workspace...")).toBeInTheDocument();
  });

  it("renders the correct message for ERROR and a retry button if provided", () => {
    const onRetrySync = vi.fn();
    render(<ExplainableLoader state="ERROR" onRetrySync={onRetrySync} />);
    expect(
      screen.getByText("Failed to sync workspace data."),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry sync/i });
    fireEvent.click(retryBtn);
    expect(onRetrySync).toHaveBeenCalledTimes(1);
  });
});
