import { GoogleGenAI } from "@google/genai";
import Exa from "exa-js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

const IntentSchema = z.object({
  queries: z.array(z.string()).max(3),
  apolloKeywords: z.array(z.string()).max(3),
});

export class DataGatherer {
  private ai: GoogleGenAI;
  private exa: Exa;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock" });
    this.exa = new Exa(process.env.EXA_API_KEY || "mock");
  }

  async gather(idea: string) {
    // 1. Extract Intent using gemini-3.1-flash with strict JSON schema
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-flash",
      contents: `Extract search queries and keywords for this idea: ${idea.replace(/[<>]/g, "")}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(IntentSchema) as any,
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    // 2. Fetch from Exa
    const exaResponse = await this.exa.searchAndContents(
      (parsed.queries && parsed.queries[0]) || "startup idea",
      {
        numResults: 3,
        text: true,
      },
    );

    // 3. Sanitize inputs to prevent prompt injection
    const sanitizedResults = exaResponse.results.map((r) => ({
      title: purify.sanitize(r.title || ""),
      text: purify.sanitize(r.text || "").replace(/[<>]/g, ""),
    }));

    return {
      queries: parsed.queries,
      apolloKeywords: parsed.apolloKeywords,
      exaResults: sanitizedResults,
    };
  }
}
