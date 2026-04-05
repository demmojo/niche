import { describe, it, expect } from "vitest";
import { BrandIdentitySchema } from "../../types/brandIdentity";

describe("BrandIdentitySchema", () => {
  it("should validate V2 schema", () => {
    const validData = {
      schemaVersion: 2 as const,
      isActive: true,
      validFrom: Date.now(),
      validTo: null,
      selected_identity: {
        positioning: {
          personality: "Bold",
          tone: ["Direct", "Professional"],
          target_audience_niche: "Startups",
        },
        visual_identity: {
          primary_color: "#123456",
          typography_pair: "Inter/Roboto",
        },
      },
    };

    const result = BrandIdentitySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail V2 schema with invalid hex color", () => {
    const invalidData = {
      schemaVersion: 2 as const,
      isActive: true,
      validFrom: Date.now(),
      validTo: null,
      selected_identity: {
        positioning: {
          personality: "Bold",
          tone: ["Direct", "Professional"],
          target_audience_niche: "Startups",
        },
        visual_identity: {
          primary_color: "123456", // missing #
          typography_pair: "Inter/Roboto",
        },
      },
    };

    const result = BrandIdentitySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should validate V1 schema", () => {
    const validV1Data = {
      schemaVersion: 1 as const,
      selected_identity: {
        positioning: {
          personality: "Calm",
          tone: ["Friendly"],
          target_audience_niche: "SMBs",
        },
        visual_identity: {
          primary_color: "#FFFFFF",
          typography_pair: "Arial",
        },
      },
    };

    const result = BrandIdentitySchema.safeParse(validV1Data);
    expect(result.success).toBe(true);
  });
});
