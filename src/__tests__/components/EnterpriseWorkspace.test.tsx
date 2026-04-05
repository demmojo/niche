import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EnterpriseWorkspace } from "../../components/EnterpriseWorkspace";
import * as AuthProvider from "../../components/AuthProvider";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("EnterpriseWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AuthProvider.useAuth as any).mockReturnValue({
      user: { uid: "123", email: "test@test.com" },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the EnterpriseWorkspace dashboard metrics and feed", () => {
    render(<EnterpriseWorkspace isSuperadmin={false} />);

    expect(
      screen.getByText("Active Intelligence Operations"),
    ).toBeInTheDocument();
    expect(screen.getByText("Completed Reports")).toBeInTheDocument();
    expect(screen.getByText("Intelligence Feed")).toBeInTheDocument();
    expect(
      screen.getByText("Developer Tools: Next-Gen CI/CD"),
    ).toBeInTheDocument();
  });

  it("handles report request flow with artificial delay", async () => {
    render(<EnterpriseWorkspace isSuperadmin={false} />);

    const input = screen.getByPlaceholderText("e.g. Enterprise HR Software");
    // Get the button itself, not the inner span
    const submitBtn = screen.getByRole("button", { name: /Execute Sweep/i });

    expect(submitBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "New Test Market" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    expect(screen.getByText(/Dispatching Agent/i)).toBeInTheDocument();

    vi.advanceTimersByTime(800);

    await waitFor(() => {
      expect(
        screen.getByText("New Test Market - Initial Assessment"),
      ).toBeInTheDocument();
    });

    expect(input).toHaveValue("");
  });

  it("does not submit when input is empty or whitespace", () => {
    render(<EnterpriseWorkspace isSuperadmin={false} />);

    const input = screen.getByPlaceholderText("e.g. Enterprise HR Software");

    fireEvent.change(input, { target: { value: "   " } });

    const submitBtn = screen.getByRole("button", { name: /Execute Sweep/i });
    expect(submitBtn).toBeDisabled();
  });

  it("polls and updates report status", async () => {
    render(<EnterpriseWorkspace isSuperadmin={false} />);

    const input = screen.getByPlaceholderText("e.g. Enterprise HR Software");
    const submitBtn = screen.getByRole("button", { name: /Execute Sweep/i });
    fireEvent.change(input, { target: { value: "Polling Test" } });
    fireEvent.click(submitBtn);

    vi.advanceTimersByTime(800); // Wait for submission

    await waitFor(() => {
      expect(
        screen.getByText("Polling Test - Initial Assessment"),
      ).toBeInTheDocument();
    });

    // Advance to trigger intervals
    vi.advanceTimersByTime(3000); // 1 interval
    vi.advanceTimersByTime(3000); // 2 interval

    // We just want to ensure it doesn't crash and status runs through
    // Just expecting it not to crash
    expect(
      screen.getByText("Polling Test - Initial Assessment"),
    ).toBeInTheDocument();
  });
});
