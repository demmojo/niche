import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataGatherer } from "../../server/agents/DataGatherer";
import { ReportSynthesizer } from "../../server/agents/ReportSynthesizer";

let mockExaResults = [
  { title: "Competitor 1", text: "We do dog walking software." },
];

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async ({ model }) => {
          if (model === "gemini-3.1-flash") {
            return {
              text: JSON.stringify({
                queries: ["SaaS for dog walkers"],
                apolloKeywords: ["dog walking", "pet care software"],
              }),
            };
          }
          if (model === "gemini-3.1-pro") {
            return {
              text: JSON.stringify({
                tarpitScore: 85,
                draftMarkdown: "## Tarpit Analysis\nHigh saturation.",
                moatIdentified: "None",
              }),
            };
          }
        }),
      },
    })),
  };
});

vi.mock("exa-js", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      searchAndContents: vi.fn().mockImplementation(async () => {
        return { results: mockExaResults };
      }),
    })),
  };
});

describe("Superadmin Pipeline 2-Agent Setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExaResults = [
      { title: "Competitor 1", text: "We do dog walking software." },
    ];
  });

  describe("DataGatherer", () => {
    it("extracts intent and fetches Exa context", async () => {
      const gatherer = new DataGatherer();
      const context = await gatherer.gather("A CRM for dog walkers");

      expect(context.exaResults).toBeDefined();
      expect(context.exaResults.length).toBeGreaterThan(0);
      expect(context.queries).toContain("SaaS for dog walkers");
      expect(context.apolloKeywords).toContain("dog walking");
    });

    it("handles missing title or text from Exa gracefully", async () => {
      mockExaResults = [{ title: undefined, text: undefined } as any];
      const gatherer = new DataGatherer();
      const context = await gatherer.gather("A CRM for dog walkers");

      expect(context.exaResults).toBeDefined();
      expect(context.exaResults[0].title).toBe("");
      expect(context.exaResults[0].text).toBe("");
    });
  });

  describe("ReportSynthesizer", () => {
    it("synthesizes markdown and validates mathematical override", async () => {
      const synthesizer = new ReportSynthesizer();

      const context = {
        exaResults: [
          { title: "Competitor 1", text: "We do dog walking software." },
        ],
        apolloKeywords: ["dog walking"],
      };

      // Math score = 1 * 20 = 20. LLM score = 85. Diff = 65 > 15.
      // So finalScore = 20, wasOverridden = true.
      const result = await synthesizer.synthesize(
        "A CRM for dog walkers",
        context,
      );

      expect(result.draftMarkdown).toContain("## Tarpit Analysis");
      expect(result.tarpitScore).toBe(20);
      expect(result.wasOverridden).toBe(true);
    });

    it("does not override if math and LLM are close", async () => {
      const synthesizer = new ReportSynthesizer();

      // 4 results => math score = 80. LLM score = 85. Diff = 5 <= 15.
      // So finalScore = 85, wasOverridden = false.
      const context = {
        exaResults: [{}, {}, {}, {}],
        apolloKeywords: ["dog walking"],
      };

      const result = await synthesizer.synthesize(
        "A CRM for dog walkers",
        context,
      );

      expect(result.tarpitScore).toBe(85);
      expect(result.wasOverridden).toBe(false);
    });

    it("handles zero exa results", async () => {
      const synthesizer = new ReportSynthesizer();

      // 0 results => math score = 0. LLM score = 85. Diff = 85 > 15.
      // So finalScore = 0, wasOverridden = true.
      const context = {
        exaResults: [],
        apolloKeywords: ["dog walking"],
      };

      const result = await synthesizer.synthesize(
        "A CRM for dog walkers",
        context,
      );

      expect(result.tarpitScore).toBe(0);
      expect(result.wasOverridden).toBe(true);
    });

    it("handles missing environment variables and empty text", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementationOnce(
        () =>
          ({
            models: {
              generateContent: vi.fn().mockResolvedValue({}),
            },
          }) as any,
      );

      const synthesizer = new ReportSynthesizer();
      const result = await synthesizer.synthesize("idea", {
        exaResults: [],
        apolloKeywords: [],
      });
      expect(result.tarpitScore).toBeUndefined();

      process.env.GEMINI_API_KEY = originalKey;
    });
  });

  describe("DataGatherer fallback coverage", () => {
    it("handles missing environment variables and empty text", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementationOnce(
        () =>
          ({
            models: {
              generateContent: vi.fn().mockResolvedValue({}),
            },
          }) as any,
      );

      const gatherer = new DataGatherer();
      const result = await gatherer.gather("Some idea");
      expect(result.exaResults).toHaveLength(1);

      process.env.GEMINI_API_KEY = originalKey;
    });
  });
});
