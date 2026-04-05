import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateArtifactTone } from "../../utils/artifactReviewer";
import { GoogleGenAI } from "@google/genai";
import { ZodError } from "zod";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: (...args: any[]) => mockGenerateContent(...args),
        },
      };
    }),
  };
});

describe("validateArtifactTone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBrandIdentity = {
    selected_identity: {
      positioning: {
        tone: ["friendly", "professional"],
      },
    },
  };

  it("should validate and return compliance when API returns valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        isToneCompliant: true,
        feedback: "Looks good!",
      }),
    });

    const result = await validateArtifactTone(
      "<div>Hello</div>",
      validBrandIdentity,
      "test-api-key",
    );

    expect(result).toEqual({
      isToneCompliant: true,
      feedback: "Looks good!",
    });

    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.1-flash",
        contents: expect.stringContaining("friendly, professional"),
        config: expect.objectContaining({
          responseMimeType: "application/json",
        }),
      }),
    );
  });

  it("should throw error if brand identity is missing positioning", async () => {
    const invalidBrandIdentity = {
      selected_identity: {},
    };

    await expect(
      validateArtifactTone("<div>Hello</div>", invalidBrandIdentity, "key"),
    ).rejects.toThrow("Incomplete brand identity.");
  });

  it("should throw error if brand identity is totally missing", async () => {
    await expect(
      validateArtifactTone("<div>Hello</div>", null, "key"),
    ).rejects.toThrow("Incomplete brand identity.");
  });

  it("should handle empty response text by defaulting to empty object and failing schema validation", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
    });

    await expect(
      validateArtifactTone("<div>Hello</div>", validBrandIdentity, "key"),
    ).rejects.toThrowError(ZodError);
  });

  it("should fail validation if response JSON does not match schema", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        isToneCompliant: "not-a-boolean", // Invalid type
        feedback: 123, // Invalid type
      }),
    });

    await expect(
      validateArtifactTone("<div>Hello</div>", validBrandIdentity, "key"),
    ).rejects.toThrowError(ZodError);
  });
});
