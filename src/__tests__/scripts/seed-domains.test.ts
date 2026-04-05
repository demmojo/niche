import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processSeedUrls,
  hashDomain,
  parseSitemap,
} from "../../../scripts/seed-domains";

describe("seed-domains script intent", () => {
  const mockCreateTask = vi.fn().mockResolvedValue([{ name: "test-task" }]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hashes domains to group URLs effectively", () => {
    const hash1 = hashDomain("https://example.com/foo");
    const hash2 = hashDomain("https://example.com/bar");
    const hash3 = hashDomain("https://different.com/baz");
    const hash4 = hashDomain("http://example.com"); // different protocol, same domain

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    // Protocol should not matter for domain hashing
    expect(hash1).toBe(hash4);
  });

  it("parses XML sitemaps to extract URLs", async () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/1</loc></url>
        <url><loc>https://example.com/2</loc></url>
      </urlset>
    `;
    const urls = await parseSitemap(xml);
    expect(urls).toEqual(["https://example.com/1", "https://example.com/2"]);
  });

  it("dispatches URLs to Cloud Tasks with staggered scheduleTime based on domain hash", async () => {
    const mockUrls = [
      "https://example.com/1",
      "https://example.com/2",
      "https://different.com/1",
      "https://example.com/3",
    ];

    await processSeedUrls(mockUrls, mockCreateTask, {
      projectId: "test-project",
      location: "us-central1",
      queue: "market-intelligence-seed",
      workerUrl: "https://worker/api/seed",
    });

    expect(mockCreateTask).toHaveBeenCalledTimes(4);

    const calls = mockCreateTask.mock.calls;

    const tasks = calls.map((c) => c[0].task);

    // Check that tasks have the correct target
    expect(tasks[0].httpRequest.url).toBe("https://worker/api/seed");
    expect(tasks[0].httpRequest.httpMethod).toBe("POST");

    // Example.com URLs should have staggered schedule times
    // different.com URL could be scheduled independently

    const exampleTasks = tasks.filter((t) => {
      const payload = JSON.parse(
        Buffer.from(t.httpRequest.body, "base64").toString(),
      );
      return payload.domain.includes("example.com");
    });

    expect(exampleTasks.length).toBe(3);

    // The schedule times for the same domain should increase
    // to prevent hammering the same domain or Firestore partition at once
    const time1 = exampleTasks[0].scheduleTime.seconds;
    const time2 = exampleTasks[1].scheduleTime.seconds;
    const time3 = exampleTasks[2].scheduleTime.seconds;

    expect(time2).toBeGreaterThan(time1);
    expect(time3).toBeGreaterThan(time2);
  });
});
