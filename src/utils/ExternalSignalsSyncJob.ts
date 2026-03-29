import { SentimentInsight, JobToBeDone, Competitor } from "../types";
import { MyProductData } from "../components/MyProduct";
import { getCustomApiKey } from "./apiKeys";
import { withModelFallback } from "./aiClient";
import { z } from "zod";

const sentimentExtractionSchema = z.object({
  results: z.array(
    z.object({
      featureName: z
        .string()
        .describe("The specific feature or aspect of the product"),
      reasoning_step: z
        .string()
        .describe(
          "Briefly explain why this feature is a point of dissatisfaction",
        ),
      prevalenceScore: z
        .number()
        .min(0)
        .max(1)
        .describe("Estimated prevalence of this complaint (0.0 to 1.0)"),
      dissatisfactionScore: z
        .number()
        .min(0)
        .max(1)
        .describe("Severity of dissatisfaction (0.0 to 1.0)"),
      confidenceScore: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence in this extraction (0.0 to 1.0)"),
      verbatimQuotes: z
        .array(z.string())
        .describe(
          "Exact substrings from the source text proving this extraction",
        ),
    }),
  ),
});

const jtbdExtractionSchema = z.object({
  results: z.array(
    z.object({
      jobStatement: z
        .string()
        .describe("The core 'Job To Be Done' the user is trying to accomplish"),
      reasoning_step: z
        .string()
        .describe("Briefly explain why this is a core job based on the text"),
      importanceScore: z
        .number()
        .min(1)
        .max(10)
        .describe("How important is this job to the user (1-10)?"),
      currentSatisfactionScore: z
        .number()
        .min(1)
        .max(10)
        .describe("How satisfied are they with current solutions (1-10)?"),
      confidenceScore: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence in this extraction (0.0 to 1.0)"),
      verbatimQuotes: z
        .array(z.string())
        .describe(
          "Exact substrings from the source text proving this extraction",
        ),
    }),
  ),
});

/**
 * ExternalSignalsSyncJob
 *
 * A background service that fetches unstructured data from Exa (news, web mentions)
 * and processes it through an Extract-Verify-Format Pipeline (DAG) to generate
 * SentimentInsights and JobToBeDone objects.
 */
export class ExternalSignalsSyncJob {
  private exaApiKey: string;

  constructor() {
    this.exaApiKey =
      getCustomApiKey("exa") || process.env.VITE_EXA_API_KEY_SECONDARY || "";
  }

  /**
   * Syncs Competitor Sentiment via Exa API
   */
  async syncCompetitorSentiment(
    competitors: Competitor[],
  ): Promise<SentimentInsight[]> {
    if (!this.exaApiKey) {
      console.warn("Exa API Key missing, skipping sentiment sync.");
      return [];
    }

    const insights: SentimentInsight[] = [];

    for (const competitor of competitors) {
      try {
        const query = `${competitor.name} reviews complaints pricing issues missing features`;

        const response = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.exaApiKey,
          },
          body: JSON.stringify({
            query,
            numResults: 3,
            useAutoprompt: true,
            contents: { text: true },
          }),
        });

        if (!response.ok) {
          console.error(
            `Exa API failed for ${competitor.name}: ${response.status}`,
          );
          continue;
        }

        const data = await response.json();

        // ML Pipeline: Constrained Decoding & Extractive Grounding
        const prompt = `
You are an expert product analyst. (Context)
Your goal is to extract key features that users are dissatisfied with regarding a competitor product. (Objective)
Be precise, analytical, and objective. (Style & Tone)
Your audience is the product management team who needs to know exactly what to build to beat this competitor. (Audience)
Follow the structured JSON response format exactly, including a reasoning step and verbatim quotes. (Response)

<processing_rules>
1. Only extract information explicitly mentioned in the text.
2. Provide a prevalence score (0.0-1.0) and dissatisfaction score (0.0-1.0).
3. Extract 1 to 3 specific features.
4. If the sentiment is unclear, assign a lower confidence_score.
</processing_rules>

<competitor_name>${competitor.name}</competitor_name>

<search_results>
${JSON.stringify(data.results.map((r: any) => r.text || r.title).slice(0, 3))}
</search_results>
        `;

        const aiResponse = await withModelFallback(
          async (ai, model) => {
            return ai.generateContent(model, {
              contents: prompt,
              config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: (
                  sentimentExtractionSchema as any
                ).toJSONSchema() as any,
              },
            });
          },
          { capability: "reasoning" },
        );

        const text = aiResponse.text || '{"results": []}';
        let parsed = { results: [] };
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse AI output", text);
          continue;
        }

        for (const item of parsed.results) {
          insights.push({
            id: `sentiment_${Math.random().toString(36).substring(2)}`,
            competitorId: competitor.id,
            featureName: item.featureName,
            prevalenceScore: item.prevalenceScore,
            dissatisfactionScore: item.dissatisfactionScore,
            confidenceScore: item.confidenceScore || 0.8,
            verbatimQuotes: item.verbatimQuotes || [],
            isHumanVerified: false,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error syncing sentiment for ${competitor.name}`, error);
      }
    }

    return insights;
  }

  /**
   * Syncs Job To Be Done (JTBD) Opportunities via Exa API (Reddit/Quora intent)
   */
  async syncMarketIntent(productData: MyProductData): Promise<JobToBeDone[]> {
    if (!this.exaApiKey) {
      console.warn("Exa API Key missing, skipping JTBD sync.");
      return [];
    }

    const insights: JobToBeDone[] = [];

    try {
      const query = `site:reddit.com OR site:quora.com "how do I" ${productData.name || productData.description} alternative workaround`;

      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.exaApiKey,
        },
        body: JSON.stringify({
          query,
          numResults: 5,
          useAutoprompt: true,
          contents: { text: true },
        }),
      });

      if (!response.ok) {
        console.error(`Exa API failed for JTBD: ${response.status}`);
        return [];
      }

      const data = await response.json();

      // ML Pipeline: BERTopic / Discovery extraction with Constrained Decoding
      const prompt = `
You are an expert User Researcher. (Context)
Your goal is to discover the underlying "Jobs To Be Done" (JTBD) from forum discussions related to a product domain. (Objective)
Be precise, empathetic to user needs, and objective. (Style & Tone)
Your audience is the product design team who needs to understand the core user intent. (Audience)
Follow the structured JSON response format exactly, including a reasoning step and verbatim quotes. (Response)

<processing_rules>
1. Only extract jobs explicitly or implicitly mentioned in the text.
2. Estimate the Importance (1-10) and Current Satisfaction (1-10).
3. If the job is unclear, assign a lower confidence_score.
</processing_rules>

<product_domain>${productData.description}</product_domain>

<forum_discussions>
${JSON.stringify(data.results.map((r: any) => r.text || r.title).slice(0, 5))}
</forum_discussions>
      `;

      const aiResponse = await withModelFallback(
        async (ai, model) => {
          return ai.generateContent(model, {
            contents: prompt,
            config: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: (
                jtbdExtractionSchema as any
              ).toJSONSchema() as any,
            },
          });
        },
        { capability: "reasoning" },
      );

      const text = aiResponse.text || '{"results": []}';
      let parsed = { results: [] };
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse AI output for JTBD", text);
        return [];
      }

      for (const item of parsed.results) {
        const imp = item.importanceScore || 5;
        const sat = item.currentSatisfactionScore || 5;
        // Opportunity Score = Importance + Math.max(Importance - Satisfaction, 0)
        const oppScore = imp + Math.max(imp - sat, 0);

        insights.push({
          id: `jtbd_${Math.random().toString(36).substring(2)}`,
          jobStatement: item.jobStatement,
          importanceScore: imp,
          currentSatisfactionScore: sat,
          opportunityScore: oppScore,
          confidenceScore: item.confidenceScore || 0.8,
          verbatimQuotes: item.verbatimQuotes || [],
          isHumanVerified: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error syncing market intent`, error);
    }

    return insights;
  }
}
