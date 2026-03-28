import { describe, it, expect } from "vitest";
import { generateSystemPrompt, PromptConfig, formatBrandIdentityContext, hexToHsl } from "../../utils/promptAssembler";
import { MyProductData } from "../../components/MyProduct";

describe("promptAssembler", () => {
  describe("hexToHsl", () => {
    it("converts hex to hsl correctly", () => {
      expect(hexToHsl("#000000")).toBe("0 0% 0%");
      expect(hexToHsl("#ffffff")).toBe("0 0% 100%");
      expect(hexToHsl("#ff0000")).toBe("0 100% 50%");
    });
  });

  describe("formatBrandIdentityContext", () => {
    it("returns empty string if identity is null or missing fields", () => {
      expect(formatBrandIdentityContext(null)).toBe("");
      expect(formatBrandIdentityContext({})).toBe("");
    });

    it("formats brand context correctly with provided identity", () => {
      const identity = {
        selected_identity: {
          visual_identity: {
            primary_color: "#ff0000",
            typography_pair: "Inter, sans-serif"
          },
          positioning: {
            personality: "Friendly and approachable",
            tone: ["Casual", "Helpful"]
          }
        }
      };

      const result = formatBrandIdentityContext(identity);
      expect(result).toContain("Friendly and approachable");
      expect(result).toContain("Casual, Helpful");
      expect(result).toContain("<primary_hsl>0 100% 50%</primary_hsl>");
      expect(result).toContain("<heading_font>Inter, sans-serif</heading_font>");
    });
  });

  describe("generateSystemPrompt", () => {
    const mockProduct: MyProductData = {
      name: "Test Product",
      description: "A cool test product",
      targetRegions: ["US"],
      features: [
        { id: "1", name: "Feature 1", description: "Does something", status: "planned" }
      ],
      strategy: []
    };

    const mockConfig: PromptConfig = {
      scope: "app",
      techStack: "react-tailwind",
      contextLevel: "strict",
      enforceBrand: false
    };

    it("generates correct CO-STAR sections", () => {
      const result = generateSystemPrompt(mockProduct, mockConfig);
      expect(result).toContain("# [CONTEXT]");
      expect(result).toContain("# [OBJECTIVE]");
      expect(result).toContain("# [CONSTRAINTS]");
      expect(result).toContain("# [RESPONSE]");
      expect(result).toContain("Test Product");
      expect(result).toContain("React functional components and Tailwind CSS");
      expect(result).toContain("Feature 1: Does something");
    });

    it("injects brand context when enforceBrand is true", () => {
      const configWithBrand: PromptConfig = { ...mockConfig, enforceBrand: true };
      const identity = {
        selected_identity: {
          visual_identity: { primary_color: "#ff0000", typography_pair: "Inter" },
          positioning: { personality: "Fun", tone: "Fun" }
        }
      };
      const result = generateSystemPrompt(mockProduct, configWithBrand, identity);
      expect(result).toContain("[STYLE] - Voice & Personality");
      expect(result).toContain("<primary_hsl>0 100% 50%</primary_hsl>");
    });

    it("does not inject brand context when enforceBrand is false", () => {
      const result = generateSystemPrompt(mockProduct, mockConfig, {
        selected_identity: {
          visual_identity: { primary_color: "#ff0000", typography_pair: "Inter" },
          positioning: { personality: "Fun", tone: "Fun" }
        }
      });
      expect(result).not.toContain("[STYLE] - Voice & Personality");
    });
  });
});
