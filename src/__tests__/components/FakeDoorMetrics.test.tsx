import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "../../test-utils/render";
import { FakeDoorMetrics } from "../../components/FakeDoorMetrics";

// Mock ResizeObserver which Recharts needs
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("FakeDoorMetrics", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<FakeDoorMetrics siteToken="test-token" />);

    expect(screen.getByText(/Loading analytics\.\.\./i)).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(<FakeDoorMetrics siteToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch metrics/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when pageViews is 0", async () => {
    (global.fetch as any).mockResolvedValue({
      /**
       *
       */
      json: () => Promise.resolve({ pageViews: 0 }),
    });

    render(<FakeDoorMetrics siteToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText(/Awaiting Initial Traffic/i)).toBeInTheDocument();
    });
  });

  it("shows metrics dashboard when data is available", async () => {
    (global.fetch as any).mockResolvedValue({
      /**
       *
       */
      json: () =>
        Promise.resolve({
          pageViews: 1234,
          uniqueVisitors: 567,
          conversionRate: "5.2%",
          referrers: ["google.com", "twitter.com"],
        }),
    });

    render(<FakeDoorMetrics siteToken="test-token" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Fake Door Validation Metrics/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("1,234")).toBeInTheDocument(); // Page Views
    expect(screen.getByText("567")).toBeInTheDocument(); // Unique Visitors
    expect(screen.getByText("5.2%")).toBeInTheDocument(); // Conversion Rate
    expect(screen.getByText("google.com")).toBeInTheDocument(); // Referrer 1
    expect(screen.getByText("twitter.com")).toBeInTheDocument(); // Referrer 2
  });
});
