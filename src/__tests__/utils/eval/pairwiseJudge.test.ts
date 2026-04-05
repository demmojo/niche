import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { evaluatePairwise } from "../../../utils/eval/pairwiseJudge";
import { GoogleGenAI } from "@google/genai";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn(),
  };
});

describe("pairwiseJudge", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key" };
    vi.clearAllMocks();
    vi.spyOn(Math, "random");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw error if GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(evaluatePairwise("prompt", "base", "cand")).rejects.toThrow(
      "GEMINI_API_KEY is missing",
    );
  });

  it("should return BASELINE_WINS when model prefers A and baseline is A", async () => {
    // Force Math.random to return > 0.5 (isBaselineA = true)
    vi.mocked(Math.random).mockReturnValue(0.6);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({ preference: "A", rationale: "A is better" }),
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("BASELINE_WINS");
    expect(result.rationale).toBe("A is better");
    expect(generateContentMock).toHaveBeenCalledTimes(1);

    const callArgs = generateContentMock.mock.calls[0][0];
    expect(callArgs.contents).toContain("OUTPUT A:\n    baseline output");
    expect(callArgs.contents).toContain("OUTPUT B:\n    candidate output");
  });

  it("should return CANDIDATE_WINS when model prefers B and baseline is A", async () => {
    // Force Math.random to return > 0.5 (isBaselineA = true)
    vi.mocked(Math.random).mockReturnValue(0.6);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({ preference: "B", rationale: "B is better" }),
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("CANDIDATE_WINS");
    expect(result.rationale).toBe("B is better");
  });

  it("should return CANDIDATE_WINS when model prefers A and baseline is B (candidate is A)", async () => {
    // Force Math.random to return < 0.5 (isBaselineA = false)
    vi.mocked(Math.random).mockReturnValue(0.4);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({ preference: "A", rationale: "A is better" }),
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("CANDIDATE_WINS");
    expect(result.rationale).toBe("A is better");
    expect(generateContentMock).toHaveBeenCalledTimes(1);

    const callArgs = generateContentMock.mock.calls[0][0];
    expect(callArgs.contents).toContain("OUTPUT A:\n    candidate output");
    expect(callArgs.contents).toContain("OUTPUT B:\n    baseline output");
  });

  it("should return BASELINE_WINS when model prefers B and baseline is B (candidate is A)", async () => {
    // Force Math.random to return < 0.5 (isBaselineA = false)
    vi.mocked(Math.random).mockReturnValue(0.4);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({ preference: "B", rationale: "B is better" }),
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("BASELINE_WINS");
    expect(result.rationale).toBe("B is better");
  });

  it("should return TIE when model prefers TIE", async () => {
    vi.mocked(Math.random).mockReturnValue(0.6);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({ preference: "TIE", rationale: "They are equal" }),
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("TIE");
    expect(result.rationale).toBe("They are equal");
  });

  it("should fallback to TIE if preference is missing or invalid", async () => {
    vi.mocked(Math.random).mockReturnValue(0.6);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        preference: "INVALID",
        rationale: "Something went wrong",
      }),
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("TIE");
    expect(result.rationale).toBe("Something went wrong");
  });

  it("should handle empty response text", async () => {
    vi.mocked(Math.random).mockReturnValue(0.6);

    const generateContentMock = vi.fn().mockResolvedValue({
      text: "",
    });

    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({
          models: { generateContent: generateContentMock },
        }) as any,
    );

    const result = await evaluatePairwise(
      "test prompt",
      "baseline output",
      "candidate output",
    );

    expect(result.preference).toBe("TIE");
    expect(result.rationale).toBeUndefined();
  });
});
