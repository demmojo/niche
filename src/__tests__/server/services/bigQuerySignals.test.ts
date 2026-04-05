import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPublicDatasetSignals } from "../../../server/services/bigQuerySignals";

const mockCreateQueryJob = vi.fn();

vi.mock("@google-cloud/bigquery", () => {
  return {
    BigQuery: vi.fn(() => ({
      createQueryJob: mockCreateQueryJob,
    })),
  };
});

describe("bigQuerySignals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return signals successfully", async () => {
    const mockGetQueryResults = vi.fn().mockResolvedValue([
      [
        {
          github_stars_30d: 42,
          hn_mentions_30d: 15,
          crux_p75_fcp: 1200,
        },
      ],
    ]);

    mockCreateQueryJob.mockResolvedValue([
      { getQueryResults: mockGetQueryResults },
    ]);

    const result = await fetchPublicDatasetSignals("example.com");

    expect(result).toEqual({
      github_stars_30d: 42,
      hn_mentions_30d: 15,
      crux_p75_fcp: 1200,
    });

    expect(mockCreateQueryJob).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { domain: "example.com" },
      }),
    );
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockGetQueryResults = vi.fn().mockResolvedValue([
      [
        {
          github_stars_30d: undefined,
          hn_mentions_30d: null,
          crux_p75_fcp: undefined,
        },
      ],
    ]);

    mockCreateQueryJob.mockResolvedValue([
      { getQueryResults: mockGetQueryResults },
    ]);

    const result = await fetchPublicDatasetSignals("example.com");

    expect(result).toEqual({
      github_stars_30d: 0,
      hn_mentions_30d: 0,
      crux_p75_fcp: null,
    });
  });

  it("should return fallback object if query fails", async () => {
    mockCreateQueryJob.mockRejectedValue(new Error("BQ Timeout"));

    const result = await fetchPublicDatasetSignals("example.com");

    expect(result).toEqual({
      github_stars_30d: 0,
      hn_mentions_30d: 0,
      crux_p75_fcp: null,
    });
  });

  it("should strip http/https protocol from domain param", async () => {
    const mockGetQueryResults = vi.fn().mockResolvedValue([[]]);
    mockCreateQueryJob.mockResolvedValue([
      { getQueryResults: mockGetQueryResults },
    ]);

    await fetchPublicDatasetSignals("https://www.example.com");

    expect(mockCreateQueryJob).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { domain: "example.com" },
      }),
    );
  });
});
