import React from "react";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { InviteMemberModal } from "../../components/InviteMemberModal";
import { addDoc } from "firebase/firestore";

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    addDoc: vi.fn(),
    collection: vi.fn(),
    serverTimestamp: vi.fn(),
  };
});

// Mock ResizeObserver for Radix UI Dialog
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("InviteMemberModal Component", () => {
  const mockUser = { email: "test@test.com", uid: "123" };

  it("renders correctly", () => {
    render(
      <InviteMemberModal
        open={true}
        onOpenChange={vi.fn()}
        workspaceId="ws-1"
        user={mockUser}
      />,
    );
    expect(screen.getByText("Invite Team Member")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("colleague@company.com"),
    ).toBeInTheDocument();
  });

  it("handles form submission successfully", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    (addDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "doc-1" });

    render(
      <InviteMemberModal
        open={true}
        onOpenChange={onOpenChange}
        workspaceId="ws-1"
        user={mockUser}
      />,
    );

    const input = screen.getByPlaceholderText("colleague@company.com");
    await user.type(input, "new@test.com");

    const submitBtn = screen.getByRole("button", { name: /Send Invite/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });

    // Check success state
    expect(screen.getByText("Invitation Sent!")).toBeInTheDocument();

    // Wait for setTimeout to call onOpenChange
    await waitFor(
      () => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      },
      { timeout: 4000 },
    );
  });

  it("handles form submission error", async () => {
    const user = userEvent.setup();
    (addDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Firebase error"),
    );

    // Prevent alert from cluttering tests
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <InviteMemberModal
        open={true}
        onOpenChange={vi.fn()}
        workspaceId="ws-1"
        user={mockUser}
      />,
    );

    const input = screen.getByPlaceholderText("colleague@company.com");
    await user.type(input, "new@test.com");

    const submitBtn = screen.getByRole("button", { name: /Send Invite/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Failed to send invite. Please try again.",
    );
    expect(submitBtn).not.toBeDisabled();

    alertSpy.mockRestore();
  });
});
