import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApprovalInbox } from "../../components/ApprovalInbox";
import { supabase } from "../../utils/hashing";

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };
  return { supabase: mockSupabase };
});

describe("ApprovalInbox", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    const chainable = ["from", "select", "eq", "order", "update"];
    chainable.forEach((method) => {
      (supabase as any)[method].mockReturnValue(supabase);
    });
  });

  it("renders loading state initially", () => {
    // Provide a promise that doesn't resolve immediately
    vi.mocked(supabase!.order).mockReturnValue(new Promise(() => {}) as any);
    render(<ApprovalInbox />);
    expect(screen.getByText("Loading inbox...")).toBeInTheDocument();
  });

  it("fetches and displays inbox items", async () => {
    const mockItems = [
      {
        id: "1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        similarity_score: 5,
        matched_logical_asset_id: "asset123",
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: mockItems,
      error: null,
    } as any);

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/1 Pending/)).toBeInTheDocument();
    });

    expect(screen.getByText(/asset123/)).toBeInTheDocument();
    expect(screen.getByText("json")).toBeInTheDocument();
  });

  it("displays mock data if Supabase fetch fails", async () => {
    vi.mocked(supabase!.order).mockRejectedValueOnce(
      new Error("Failed to fetch"),
    );

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });

    // Mock data should be displayed
    expect(screen.getByText("markdown")).toBeInTheDocument();
    expect(screen.getByText(/asset-44/)).toBeInTheDocument();
  });

  it("displays empty state when no items", async () => {
    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: [],
      error: null,
    } as any);

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(
        screen.getByText("No pending approvals. Your data library is clean."),
      ).toBeInTheDocument();
    });
  });

  it("handles item action (discard) optimistically", async () => {
    const mockItems = [
      {
        id: "inbox-1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        similarity_score: 5,
        matched_logical_asset_id: "asset123",
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: mockItems,
      error: null,
    } as any);
    vi.mocked(supabase!.eq)
      .mockReturnValueOnce(supabase as any)
      .mockResolvedValueOnce({ error: null } as any); // update response

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/asset123/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Discard/i }));

    // Should be removed optimistically
    await waitFor(() => {
      expect(screen.queryByText(/asset123/)).not.toBeInTheDocument();
    });

    expect(supabase?.from).toHaveBeenCalledWith("raw_data_inbox");
    expect(supabase?.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved_discard" }),
    );
  });

  it("handles item action (keep_both) optimistically", async () => {
    const mockItems = [
      {
        id: "inbox-1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        similarity_score: 5,
        matched_logical_asset_id: "asset123",
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: mockItems,
      error: null,
    } as any);
    vi.mocked(supabase!.eq)
      .mockReturnValueOnce(supabase as any)
      .mockResolvedValueOnce({ error: null } as any); // update response

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/asset123/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Keep Both/i }));

    await waitFor(() => {
      expect(screen.queryByText(/asset123/)).not.toBeInTheDocument();
    });

    expect(supabase?.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved_keep_both" }),
    );
  });

  it("handles item action (update) optimistically", async () => {
    const mockItems = [
      {
        id: "inbox-1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        similarity_score: 5,
        matched_logical_asset_id: "asset123",
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: mockItems,
      error: null,
    } as any);
    vi.mocked(supabase!.eq)
      .mockReturnValueOnce(supabase as any)
      .mockResolvedValueOnce({ error: null } as any); // update response

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/asset123/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Update Version/i }));

    await waitFor(() => {
      expect(screen.queryByText(/asset123/)).not.toBeInTheDocument();
    });

    expect(supabase?.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved_update" }),
    );
  });

  it("catches error silently during action if DB fails", async () => {
    const mockItems = [
      {
        id: "inbox-1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        similarity_score: 5,
        matched_logical_asset_id: "asset123",
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: mockItems,
      error: null,
    } as any);
    // Simulate error during action
    vi.mocked(supabase!.eq)
      .mockReturnValueOnce(supabase as any)
      .mockRejectedValueOnce(new Error("Network error"));
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/asset123/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Discard/i }));

    // UI should still remove it optimistically
    await waitFor(() => {
      expect(screen.queryByText(/asset123/)).not.toBeInTheDocument();
    });

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("loads mock data if error object is returned without throwing", async () => {
    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: null,
      error: { message: "Failed to fetch" },
    } as any);

    render(<ApprovalInbox />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });
  });
});
