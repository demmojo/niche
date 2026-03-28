import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApprovalBanner } from "../../components/ApprovalBanner";
import { useApprovalStore } from "../../hooks/useApprovalStore";

vi.mock("../../hooks/useApprovalStore");

describe("ApprovalBanner", () => {
  const mockSetBannerDismissed = vi.fn();
  const mockFetchInbox = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApprovalStore).mockReturnValue({
      items: [{ id: "1" }, { id: "2" }] as any,
      loading: false,
      isBannerDismissed: false,
      setBannerDismissed: mockSetBannerDismissed,
      fetchInbox: mockFetchInbox,
    } as any);
  });

  it("renders nothing if loading is true", () => {
    vi.mocked(useApprovalStore).mockReturnValue({
      loading: true,
      isBannerDismissed: false,
      items: [{ id: "1" }],
      fetchInbox: mockFetchInbox,
    } as any);

    const { container } = render(
      <ApprovalBanner onNavigate={mockOnNavigate} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing if banner is dismissed", () => {
    vi.mocked(useApprovalStore).mockReturnValue({
      loading: false,
      isBannerDismissed: true,
      items: [{ id: "1" }],
      fetchInbox: mockFetchInbox,
    } as any);

    const { container } = render(
      <ApprovalBanner onNavigate={mockOnNavigate} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing if there are no items", () => {
    vi.mocked(useApprovalStore).mockReturnValue({
      loading: false,
      isBannerDismissed: false,
      items: [],
      fetchInbox: mockFetchInbox,
    } as any);

    const { container } = render(
      <ApprovalBanner onNavigate={mockOnNavigate} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders banner with item count when criteria are met", () => {
    render(<ApprovalBanner onNavigate={mockOnNavigate} />);
    expect(screen.getByText("Pending Data Approvals (2)")).toBeInTheDocument();
    expect(mockFetchInbox).toHaveBeenCalled();
  });

  it("calls onNavigate and setBannerDismissed when Review Now is clicked", () => {
    render(<ApprovalBanner onNavigate={mockOnNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /Review Now/i }));

    expect(mockOnNavigate).toHaveBeenCalled();
    expect(mockSetBannerDismissed).toHaveBeenCalledWith(true);
  });

  it("calls setBannerDismissed when close button is clicked", () => {
    render(<ApprovalBanner onNavigate={mockOnNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /Dismiss banner/i }));

    expect(mockSetBannerDismissed).toHaveBeenCalledWith(true);
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });
});
