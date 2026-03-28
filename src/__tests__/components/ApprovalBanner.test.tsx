import React from "react";
import { render, screen, fireEvent } from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApprovalBanner } from "../../components/ApprovalBanner";
import { useApprovalStore } from "../../hooks/useApprovalStore";

describe("ApprovalBanner", () => {
  const mockFetchInbox = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useApprovalStore.setState({
      items: [{ id: "1" }, { id: "2" }] as any,
      loading: false,
      isBannerDismissed: false,
      fetchInbox: mockFetchInbox,
    });
  });

  it("renders nothing if loading is true", () => {
    useApprovalStore.setState({ loading: true, items: [{ id: "1" }] as any });
    const { container } = render(
      <ApprovalBanner onNavigate={mockOnNavigate} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing if banner is dismissed", () => {
    useApprovalStore.setState({
      isBannerDismissed: true,
      items: [{ id: "1" }] as any,
    });
    const { container } = render(
      <ApprovalBanner onNavigate={mockOnNavigate} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing if there are no items", () => {
    useApprovalStore.setState({ items: [] });
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
    expect(useApprovalStore.getState().isBannerDismissed).toBe(true);
  });

  it("calls setBannerDismissed when close button is clicked", () => {
    render(<ApprovalBanner onNavigate={mockOnNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /Dismiss banner/i }));

    expect(useApprovalStore.getState().isBannerDismissed).toBe(true);
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });
});
