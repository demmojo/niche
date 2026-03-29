import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LLMPenaltyBox } from "../../server/LLMPenaltyBox";

describe("LLMPenaltyBox", () => {
  let penaltyBox: LLMPenaltyBox;

  beforeEach(() => {
    // Reset instance before each test
    // @ts-ignore - accessing private static for reset
    LLMPenaltyBox.instance = undefined;
    penaltyBox = LLMPenaltyBox.getInstance();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should be a singleton", () => {
    const box1 = LLMPenaltyBox.getInstance();
    const box2 = LLMPenaltyBox.getInstance();
    expect(box1).toBe(box2);
  });

  it("should return true for canAttempt initially", () => {
    expect(penaltyBox.canAttempt("openai")).toBe(true);
  });

  it("should penalize after 3 consecutive failures", () => {
    // 1st failure
    penaltyBox.recordResult("openai", 500);
    expect(penaltyBox.canAttempt("openai")).toBe(true);

    // 2nd failure
    penaltyBox.recordResult("openai", 500);
    expect(penaltyBox.canAttempt("openai")).toBe(true);

    // 3rd failure (trips threshold)
    penaltyBox.recordResult("openai", 500);
    expect(penaltyBox.canAttempt("openai")).toBe(false);
  });

  it("should reset failures if a success is recorded", () => {
    penaltyBox.recordResult("openai", 500);
    penaltyBox.recordResult("openai", 500);

    // Success!
    penaltyBox.recordResult("openai", 200);

    // Should not trip after one more failure
    penaltyBox.recordResult("openai", 500);
    expect(penaltyBox.canAttempt("openai")).toBe(true);
  });

  it("should transition to HALF_OPEN after penalty time expires", () => {
    penaltyBox.recordResult("openai", 500);
    penaltyBox.recordResult("openai", 500);
    penaltyBox.recordResult("openai", 500);

    expect(penaltyBox.canAttempt("openai")).toBe(false);

    // Advance 30 seconds (default penaltyMs)
    vi.advanceTimersByTime(30001);

    expect(penaltyBox.canAttempt("openai")).toBe(true);

    // Verify it stays HALF_OPEN until a result is recorded
    expect(penaltyBox.canAttempt("openai")).toBe(true);
  });

  it("should get resilient provider correctly", () => {
    expect(penaltyBox.getResilientProvider("openai", "anthropic")).toBe(
      "openai",
    );

    // Knock out openai
    penaltyBox.recordResult("openai", 500);
    penaltyBox.recordResult("openai", 500);
    penaltyBox.recordResult("openai", 500);

    expect(penaltyBox.getResilientProvider("openai", "anthropic")).toBe(
      "anthropic",
    );

    // Knock out anthropic
    penaltyBox.recordResult("anthropic", 500);
    penaltyBox.recordResult("anthropic", 500);
    penaltyBox.recordResult("anthropic", 500);

    expect(() =>
      penaltyBox.getResilientProvider("openai", "anthropic"),
    ).toThrow("503: All configured AI providers are currently degraded.");
  });
});
