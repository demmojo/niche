import { describe, it, expect, vi, beforeEach } from "vitest";

// Set required env vars before imports
process.env.LAKE_BUCKET_NAME = "test-bucket";

import { processStaticCrawl } from "../../../src/server/workers/staticCrawlerWorker";
import { CloudTasksClient } from "@google-cloud/tasks";

vi.mock("@google-cloud/tasks", () => {
  return {
    CloudTasksClient: vi.fn().mockImplementation(() => {
      return {
        queuePath: vi
          .fn()
          .mockReturnValue("projects/test/locations/test/queues/test"),
        createTask: vi.fn().mockResolvedValue([{ name: "test-task" }]),
      };
    }),
  };
});

import { Storage } from "@google-cloud/storage";

vi.mock("@google-cloud/storage", () => {
  const saveMock = vi.fn().mockResolvedValue(undefined);
  const fileMock = vi.fn().mockReturnValue({ save: saveMock });
  const bucketMock = vi.fn().mockReturnValue({ file: fileMock });

  return {
    Storage: vi.fn().mockImplementation(() => {
      return {
        bucket: bucketMock,
      };
    }),
    // Expose mocks for testing
    _fileMock: fileMock,
  };
});

// @ts-ignore
import { _fileMock } from "@google-cloud/storage";

describe("staticCrawlerWorker intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("targets high-signal paths instead of the full domain", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("<html><body>mock content</body></html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const domain = "https://example.com";
    await processStaticCrawl({ domain });

    // Should fetch the targeted paths
    const fetchCalls = mockFetch.mock.calls.map((call) => call[0]);
    expect(fetchCalls).toContain("https://example.com/careers");
    expect(fetchCalls).toContain("https://example.com/changelog");
    expect(fetchCalls).toContain("https://example.com/integrations");

    vi.unstubAllGlobals();
  });

  it("hashes prefix for GCS storage to avoid hotspotting", async () => {
    // Clear the previous mock calls from other tests
    (_fileMock as any).mockClear();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("<html><body>mock content</body></html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    await processStaticCrawl({ domain: "https://example.com" });

    // The file path should contain a hash prefix
    const savedPath = (_fileMock as any).mock.calls[0][0];

    // e.g. "raw-payloads/a1b2/example.com/careers.html"
    const parts = savedPath.split("/");
    const hashPrefix = parts[1];

    // Hash prefix should be exactly 4 chars hex (or some hash length)
    expect(hashPrefix).toMatch(/^[a-f0-9]+$/);
    expect(savedPath).toContain("example.com");

    vi.unstubAllGlobals();
  });

  it("returns 403 fallback status if bot-wall detected and attempts task dispatch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue("Forbidden"),
    });
    vi.stubGlobal("fetch", mockFetch);

    vi.stubEnv("GCP_PROJECT_ID", "test-project");
    vi.stubEnv("GCP_LOCATION", "us-central1");
    vi.stubEnv("FIRECRAWL_WORKER_URL", "https://firecrawl.example.com");

    const result = await processStaticCrawl({ domain: "https://example.com" });

    // The worker should signal back to Cloud Tasks to fallback to Firecrawl Spot VMs
    expect(result.botWallDetected).toBe(true);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("triggers fallback on AbortError (timeout)", async () => {
    const abortErr = new Error("AbortError");
    abortErr.name = "AbortError";
    const mockFetch = vi.fn().mockRejectedValue(abortErr);
    vi.stubGlobal("fetch", mockFetch);

    vi.stubEnv("GCP_PROJECT_ID", "test-project");
    vi.stubEnv("GCP_LOCATION", "us-central1");
    vi.stubEnv("FIRECRAWL_WORKER_URL", "https://firecrawl.example.com");

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await processStaticCrawl({ domain: "https://example.com" });

    expect(result.botWallDetected).toBe(true);

    consoleLogSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
