import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RawDataLibraryTabular } from "../../components/RawDataLibraryTabular";
import { supabase } from "../../utils/hashing";

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  return { supabase: mockSupabase };
});

// We need to mock the detail modal to isolate the test and ensure it doesn't try to make its own requests
vi.mock("../../components/RawDataDetailModal", () => ({
  RawDataDetailModal: ({ isOpen, asset, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="detail-modal">
        Modal Open for {asset?.logical_asset_id}
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  },
}));

describe("RawDataLibraryTabular", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    const chainable = ["from", "select", "order", "limit"];
    chainable.forEach((method) => {
      (supabase as any)[method].mockReturnValue(supabase);
    });
  });

  it("renders loading state initially", () => {
    vi.mocked(supabase!.limit).mockReturnValue(new Promise(() => {}) as any);
    render(<RawDataLibraryTabular />);
    expect(screen.getByText("Loading raw data library...")).toBeInTheDocument();
  });

  it("fetches and displays data successfully", async () => {
    const mockData = [
      {
        id: "1",
        logical_asset_id: "asset123456",
        data_type: "json",
        blob_uri: "s3://bucket/test.json",
        extracted_metadata: { key: "value" },
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        logical_asset_id: "asset789012",
        data_type: "markdown",
        blob_uri: "s3://bucket/test.md",
        extracted_metadata: { key: "value2" },
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        logical_asset_id: "assetimage",
        data_type: "image",
        blob_uri: "s3://bucket/test.png",
        extracted_metadata: { key: "value3" },
        created_at: new Date().toISOString(),
      },
      {
        id: "4",
        logical_asset_id: "assetother",
        data_type: "other",
        blob_uri: "s3://bucket/test.other",
        extracted_metadata: { key: "value4" },
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(supabase!.limit).mockResolvedValueOnce({
      data: mockData,
      error: null,
    } as any);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText("Raw Data Library")).toBeInTheDocument();
    });

    expect(screen.getByText(/asset123/)).toBeInTheDocument(); // truncated to 8 chars
    expect(screen.getByText(/asset789/)).toBeInTheDocument();
    expect(screen.getByText("json")).toBeInTheDocument();
    expect(screen.getByText("markdown")).toBeInTheDocument();
    expect(screen.getByText("image")).toBeInTheDocument();
    expect(screen.getByText("other")).toBeInTheDocument();
  });

  it("displays empty state when no data", async () => {
    vi.mocked(supabase!.limit).mockResolvedValueOnce({
      data: [],
      error: null,
    } as any);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText("No raw data ingested yet.")).toBeInTheDocument();
    });
  });

  it("displays mock data and warning if DB fetch fails", async () => {
    vi.mocked(supabase!.limit).mockRejectedValueOnce(
      new Error("Failed to fetch"),
    );

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });

    expect(screen.getByText(/asset-1/)).toBeInTheDocument();
    expect(screen.getByText(/asset-2/)).toBeInTheDocument();
  });

  it("displays mock data if error returned without throwing", async () => {
    vi.mocked(supabase!.limit).mockResolvedValueOnce({
      data: null,
      error: { message: "Failed to fetch" },
    } as any);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });
  });

  it("sets error state if unhandled error occurs", async () => {
    vi.mocked(supabase!.limit).mockRejectedValueOnce(
      new Error("Random error string"),
    );

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText("Raw Data Library")).toBeInTheDocument();
    });
    // Check it doesn't show offline message
    expect(
      screen.queryByText(/Local Database Offline/),
    ).not.toBeInTheDocument();
  });

  it("opens and closes the detail modal when clicking a row", async () => {
    const mockData = [
      {
        id: "1",
        logical_asset_id: "asset123456",
        data_type: "json",
        blob_uri: "s3://bucket/test.json",
        extracted_metadata: { key: "value" },
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(supabase!.limit).mockResolvedValueOnce({
      data: mockData,
      error: null,
    } as any);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText(/asset123/)).toBeInTheDocument();
    });

    // Modal should be closed initially
    expect(screen.queryByTestId("detail-modal")).not.toBeInTheDocument();

    // Click the row
    fireEvent.click(screen.getByText(/asset123/));

    // Modal should open
    expect(screen.getByTestId("detail-modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Open for asset123456")).toBeInTheDocument();

    // Close the modal
    fireEvent.click(screen.getByText("Close Modal"));
    expect(screen.queryByTestId("detail-modal")).not.toBeInTheDocument();
  });
});
