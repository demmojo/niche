import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RequestAccessModal } from "../../components/RequestAccessModal";
import { addDoc } from "firebase/firestore";

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    addDoc: vi.fn(),
    collection: vi.fn(),
  };
});

// Mock ResizeObserver for Radix UI Dialog
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("RequestAccessModal Component", () => {
  const mockUser = { email: "test@test.com", uid: "123" };

  it("renders correctly", () => {
    render(
      <RequestAccessModal
        open={true}
        onOpenChange={vi.fn()}
        feature="Test Feature"
        user={mockUser}
      />,
    );
    expect(screen.getByText("Upgrade to Access")).toBeInTheDocument();
    expect(screen.getByText(/Test Feature/)).toBeInTheDocument();
  });

  it("handles request submission successfully", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    (addDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "doc-1" });

    render(
      <RequestAccessModal
        open={true}
        onOpenChange={onOpenChange}
        feature="Test Feature"
        user={mockUser}
      />,
    );

    const requestBtn = screen.getByRole("button", { name: /Request Access/i });
    await user.click(requestBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });

    expect(screen.getByText("Request Sent!")).toBeInTheDocument();

    const doneBtn = screen.getByRole("button", { name: /Close/i });
    await user.click(doneBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("handles request submission error gracefully", async () => {
    const user = userEvent.setup();
    (addDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Firebase error"),
    );

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <RequestAccessModal
        open={true}
        onOpenChange={vi.fn()}
        feature="Test Feature"
        user={mockUser}
      />,
    );

    const requestBtn = screen.getByRole("button", { name: /Request Access/i });
    await user.click(requestBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });

    // Should re-enable button
    expect(requestBtn).not.toBeDisabled();

    consoleSpy.mockRestore();
  });
});
