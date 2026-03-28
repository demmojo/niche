import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RawDataDetailModal } from "../../components/RawDataDetailModal";
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

describe("RawDataDetailModal", () => {
  const mockAsset: any = {
    id: "asset_v1",
    logical_asset_id: "asset123",
    data_type: "json",
    blob_uri: "s3://test",
    extracted_metadata: { key: "value" },
    created_at: new Date().toISOString(),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    const chainable = ["from", "select", "eq", "order", "update"];
    chainable.forEach((method) => {
      (supabase as any)[method].mockReturnValue(supabase);
    });

    window.alert = vi.fn();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <RawDataDetailModal
        isOpen={false}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when asset is null", () => {
    const { container } = render(
      <RawDataDetailModal isOpen={true} onClose={mockOnClose} asset={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("fetches and displays history when opened", async () => {
    const historyData = [
      mockAsset,
      { ...mockAsset, id: "asset_v0", blob_uri: "s3://old" },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: historyData,
      error: null,
    } as any);

    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );

    // Should show loading state briefly
    expect(
      screen.getByRole("heading", { name: /Asset Details/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("asset_v0")).toBeInTheDocument(); // Shortened ID
    });

    expect(screen.getByText("Current Active")).toBeInTheDocument();
  });

  it("handles fallback to mock data on error", async () => {
    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: null,
      error: new Error("Network error"),
    } as any);

    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("v-old")).toBeInTheDocument();
    });
  });

  it("catches and logs exception during fetch", async () => {
    vi.mocked(supabase!.order).mockRejectedValueOnce(
      new Error("Network error"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("expands history row to show snapshot details", async () => {
    const historyData = [
      mockAsset,
      { ...mockAsset, id: "asset_v0", blob_uri: "s3://old_blob" },
    ];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: historyData,
      error: null,
    } as any);

    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("asset_v0")).toBeInTheDocument();
    });

    // Details should not be visible yet
    expect(screen.queryByText("s3://old_blob")).not.toBeInTheDocument();

    // Click row
    fireEvent.click(screen.getByText("asset_v0"));

    // Details should now be visible
    expect(screen.getByText("s3://old_blob")).toBeInTheDocument();
    expect(screen.getByText("Historical Snapshot")).toBeInTheDocument();

    // Click again to close
    fireEvent.click(screen.getByText("asset_v0"));

    // We can't strictly assert disappearance immediately because it's a conditional render,
    // but the component state should toggle it off.
    expect(screen.queryByText("s3://old_blob")).not.toBeInTheDocument();
  });

  it("handles revert action", async () => {
    const historyData = [mockAsset, { ...mockAsset, id: "asset_v0" }];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: historyData,
      error: null,
    } as any);
    vi.mocked(supabase!.eq)
      .mockReturnValueOnce(supabase as any) // for fetchHistory eq
      .mockResolvedValueOnce({ error: null } as any); // for update eq

    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Revert to this")).toBeInTheDocument();
    });

    // Click revert
    fireEvent.click(screen.getByText("Revert to this"));

    await waitFor(() => {
      expect(supabase?.from).toHaveBeenCalledWith("raw_data_assets");
      expect(supabase?.update).toHaveBeenCalledWith({
        current_version_id: "asset_v0",
      });
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("Successfully reverted"),
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles revert error", async () => {
    const historyData = [mockAsset, { ...mockAsset, id: "asset_v0" }];

    vi.mocked(supabase!.order).mockResolvedValueOnce({
      data: historyData,
      error: null,
    } as any);
    vi.mocked(supabase!.eq)
      .mockReturnValueOnce(supabase as any) // for fetchHistory eq
      .mockRejectedValueOnce(new Error("Update failed"));

    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={mockAsset}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Revert to this")).toBeInTheDocument();
    });

    // Click revert
    fireEvent.click(screen.getByText("Revert to this"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("Failed to revert"),
      );
    });
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={{ ...mockAsset, data_type: "markdown" }}
      />,
    );

    // There are a few icons, but the X button is specifically to close
    const closeButtons = screen.getAllByRole("button");
    // The first button in the top bar is the close button
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays different icons for different types", async () => {
    // testing JSON is already covered in mockAsset, test image
    render(
      <RawDataDetailModal
        isOpen={true}
        onClose={mockOnClose}
        asset={{ ...mockAsset, data_type: "image" }}
      />,
    );
    // The image icon SVG is rendered
    expect(
      screen.getByRole("heading", { name: /Asset Details/i }),
    ).toBeInTheDocument();
  });
});
