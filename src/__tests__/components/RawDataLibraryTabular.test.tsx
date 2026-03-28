import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RawDataLibraryTabular } from "../../components/RawDataLibraryTabular";
import { supabase } from "../../utils/hashing";

// Minimal mock setup
vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  return { supabase: mockSupabase };
});

// We need to mock Promise.all specifically because the component uses it for fetching versions and metrics
const originalPromiseAll = Promise.all;

describe("RawDataLibraryTabular", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // We mock Promise.all to intercept the parallel requests
    Promise.all = vi.fn().mockImplementation((promises) => {
      return originalPromiseAll.call(Promise, promises);
    });

    const chainable = ["from", "select", "order", "limit"];
    chainable.forEach((method) => {
      (supabase as any)[method].mockReturnValue(supabase);
    });
  });

  afterEach(() => {
    Promise.all = originalPromiseAll;
  });

  it("renders loading state initially", () => {
    // Mock the individual chained promises to stay pending
    (supabase as any).limit.mockReturnValue(new Promise(() => {}));

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
    ];

    const mockMetrics = [
      {
        id: "m1",
        asset_version_id: "1",
        logical_asset_id: "asset123456",
        metric_name: "test_metric",
        value: 123,
        source_id: "test",
        ai_confidence_score: 90,
        static_source_weight: 90,
        is_pinned: false,
        created_at: new Date().toISOString(),
      },
    ];

    // Mock the parallel promise array response
    Promise.all = vi.fn().mockResolvedValue([
      { data: mockData, error: null },
      { data: mockMetrics, error: null },
    ]);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText("Raw Data Library")).toBeInTheDocument();
    });

    // We switch tabs in tests to check both sections
    expect(screen.getByText(/test metric/i)).toBeInTheDocument();
  });

  it("displays mock data and warning if DB fetch fails", async () => {
    Promise.all = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });

    expect(screen.getByText(/employee count/i)).toBeInTheDocument();
  });

  it("displays mock data if error returned without throwing", async () => {
    Promise.all = vi.fn().mockResolvedValue([
      { data: null, error: { message: "Failed to fetch" } },
      { data: null, error: null },
    ]);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });
  });

  it("displays mock data if error returned is a TypeError", async () => {
    Promise.all = vi.fn().mockResolvedValue([
      { data: null, error: { code: "TypeError", message: "Network error" } },
      { data: null, error: null },
    ]);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText(/Local Database Offline/)).toBeInTheDocument();
    });
  });

  it("sets mock data without offline warning if unknown error code occurs", async () => {
    Promise.all = vi.fn().mockResolvedValue([
      {
        data: null,
        error: { code: "UnknownCode", message: "Some server issue" },
      },
      { data: null, error: null },
    ]);

    render(<RawDataLibraryTabular />);

    await waitFor(() => {
      expect(screen.getByText("Raw Data Library")).toBeInTheDocument();
    });

    // It should load mock data, but NOT trigger the offline warning
    expect(
      screen.queryByText(/Local Database Offline/),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/employee count/i)).toBeInTheDocument();
  });
});
