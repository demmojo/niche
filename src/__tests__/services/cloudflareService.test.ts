import { describe, it, expect, vi } from "vitest";
import { deployToCloudflare } from "../../services/cloudflareService";

describe("cloudflareService", () => {
  it("should return simulated deployment logs after a delay", async () => {
    vi.useFakeTimers();

    const promise = deployToCloudflare("my-project");

    vi.advanceTimersByTime(1000);

    const result = await promise;

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain("my-project");
    expect(result[result.length - 1]).toContain("completed successfully");

    vi.useRealTimers();
  });
});
