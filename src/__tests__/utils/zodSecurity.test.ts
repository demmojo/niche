import { describe, it, expect } from "vitest";
import { z } from "zod";
import { withInstruCoT } from "../../utils/zodSecurity";

describe("withInstruCoT", () => {
  it("should inject securityAnalysis pre-flight into an existing Zod object schema", () => {
    const BusinessSchema = z.object({
      extractedNiche: z.string().max(100),
      marketGap: z.string().max(250),
    });

    const SecureSchema = withInstruCoT(BusinessSchema);

    // Should parse valid structure
    const validData = {
      securityAnalysis: {
        containsRoleConfusion: false,
        containsCommandOverrides: false,
        reasoning: "Looks like a normal business idea.",
      },
      extractedNiche: "B2B SaaS for Plumbers",
      marketGap: "No easy scheduling tool.",
    };

    const result = SecureSchema.safeParse(validData);
    expect(result.success).toBe(true);

    // If it's missing securityAnalysis, it should fail
    const invalidData = {
      extractedNiche: "B2B SaaS",
      marketGap: "Gap",
    };

    const invalidResult = SecureSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
});
