import { describe, it, expect, vi } from "vitest";
import { checkSubscriptionTier } from "../../utils/subscription";

describe("subscription utils", () => {
  it("checkSubscriptionTier always returns true for now", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(checkSubscriptionTier("test_action", "free")).toBe(true);
    expect(checkSubscriptionTier("test_action", "pro")).toBe(true);
    consoleSpy.mockRestore();
  });
});
