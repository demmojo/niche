import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getCustomApiKey, ApiService } from "./apiKeys";
import { trackRequest } from "./usageTracker";

export interface AIModel {
  id: string;
  name: string;
  provider: ApiService;
}

export const fastModels = [
  "gemini-1.5-flash",
  "claude-3-haiku-20240307",
  "gpt-4o-mini",
];
export const proModels = [
  "gemini-1.5-pro",
  "claude-3-5-sonnet-20240620",
  "gpt-4o",
];

/**
 * Retrieves the user's selected main model preference.
 * Defaults to "auto" for smart routing if not set or invalid.
 */
export const getMainModel = (): string => {
  const data = localStorage.getItem("ai_main_model");
  if (data) {
    return data;
  }
  // Migration logic from old multi-select
  const oldData = localStorage.getItem("ai_selected_models");
  if (oldData) {
    try {
      const parsed = JSON.parse(oldData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Just take the first valid one if they had a specific preference
        const firstModel = parsed[0];
        setMainModel(firstModel);
        return firstModel;
      }
    } catch {
      // Ignore
    }
  }
  return "auto";
};

/**
 * Sets the user's selected main model preference.
 * @param model The model ID or "auto"
 */
export const setMainModel = (model: string) => {
  localStorage.setItem("ai_main_model", model);
};

/**
 *
 */
export const fetchAvailableModels = async (): Promise<AIModel[]> => {
  const models: AIModel[] = [
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      provider: "gemini",
    },
    {
      id: "gemini-3.1-flash-lite-preview",
      name: "Gemini 3.1 Flash Lite Preview",
      provider: "gemini",
    },
    {
      id: "gemini-3-flash-preview",
      name: "Gemini 3.0 Flash Preview",
      provider: "gemini",
    },
  ];

  const openaiKey = getCustomApiKey("openai");
  if (openaiKey) {
    try {
      const openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true,
      });
      const list = await openai.models.list();
      const chatModels = list.data.filter(
        (m) =>
          m.id.startsWith("gpt-4") ||
          m.id.startsWith("gpt-3.5") ||
          m.id.startsWith("o1") ||
          m.id.startsWith("o3"),
      );
      chatModels.forEach((m) =>
        models.push({ id: m.id, name: `OpenAI: ${m.id}`, provider: "openai" }),
      );
    } catch (e) {
      console.error("Failed to fetch OpenAI models", e);
    }
  }

  const anthropicKey = getCustomApiKey("anthropic");
  if (anthropicKey) {
    try {
      models.push(
        {
          id: "claude-3-7-sonnet-20250219",
          name: "Claude 3.7 Sonnet",
          provider: "anthropic",
        },
        {
          id: "claude-3-5-sonnet-20241022",
          name: "Claude 3.5 Sonnet",
          provider: "anthropic",
        },
        {
          id: "claude-3-5-haiku-20241022",
          name: "Claude 3.5 Haiku",
          provider: "anthropic",
        },
        {
          id: "claude-3-opus-20240229",
          name: "Claude 3 Opus",
          provider: "anthropic",
        },
      );
    } catch (e) {
      console.error("Failed to load Anthropic models", e);
    }
  }

  return models;
};

/**
 *
 * @param modelId
 */
const getProviderForModel = (modelId: string): ApiService => {
  if (
    modelId.startsWith("gpt-") ||
    modelId.startsWith("o1") ||
    modelId.startsWith("o3")
  )
    return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  return "gemini";
};

export interface GenerateParams {
  contents: string;
  config?: {
    responseMimeType?: string;
    responseSchema?: any;
    tools?: any[];
  };
}

/**
 *
 */
class AIClient {
  async generateContent(model: string, params: GenerateParams): Promise<any> {
    const provider = getProviderForModel(model);

    if (provider === "gemini") {
      const key = getCustomApiKey("gemini") || process.env.GEMINI_API_KEY;
      if (!key) throw new Error("No Gemini API key available.");
      const ai = new GoogleGenAI({ apiKey: key });
      return await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
    }

    if (provider === "openai") {
      const key = getCustomApiKey("openai");
      if (!key) throw new Error("No OpenAI API key available.");
      const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });

      let responseFormat: any = undefined;
      let systemInstruction = "";
      if (params.config?.responseMimeType === "application/json") {
        responseFormat = { type: "json_object" };
        systemInstruction = "You must output a valid JSON object or array.";
        if (params.config?.responseSchema) {
          systemInstruction +=
            "\n\nFollow this JSON schema strictly: " +
            JSON.stringify(params.config.responseSchema);
        }
      }

      let tools: any = undefined;
      if (params.config?.tools && params.config.tools.length > 0) {
        const geminiTools = params.config.tools[0]?.functionDeclarations || [];
        if (geminiTools.length > 0) {
          tools = geminiTools.map((t: any) => ({
            type: "function",
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }));
        }
      }

      const messages: any[] = [];
      if (systemInstruction)
        messages.push({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: params.contents });

      const response = await openai.chat.completions.create({
        model,
        messages,
        response_format: responseFormat,
        tools,
      });

      const msg = response.choices[0].message;
      return {
        text: msg.content,
        functionCalls: msg.tool_calls
          ? msg.tool_calls.map((tc: any) => ({
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            }))
          : undefined,
      };
    }

    if (provider === "anthropic") {
      const key = getCustomApiKey("anthropic");
      if (!key) throw new Error("No Anthropic API key available.");
      const anthropic = new Anthropic({
        apiKey: key,
        dangerouslyAllowBrowser: true,
      });

      let systemInstruction = "";
      if (params.config?.responseMimeType === "application/json") {
        systemInstruction =
          "You must output a valid JSON object or array, and nothing else.";
        if (params.config?.responseSchema) {
          systemInstruction +=
            "\n\nFollow this JSON schema strictly: " +
            JSON.stringify(params.config.responseSchema);
        }
      }

      let tools: any = undefined;
      if (params.config?.tools && params.config.tools.length > 0) {
        const geminiTools = params.config.tools[0]?.functionDeclarations || [];
        if (geminiTools.length > 0) {
          tools = geminiTools.map((t: any) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          }));
        }
      }

      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemInstruction || undefined,
        messages: [{ role: "user", content: params.contents }],
        tools,
      });

      const textContent = response.content.find(
        (c) => c.type === "text",
      ) as any;
      const toolContent = response.content.filter(
        (c) => c.type === "tool_use",
      ) as any[];

      return {
        text: textContent?.text || "",
        functionCalls:
          toolContent.length > 0
            ? toolContent.map((tc) => ({
                name: tc.name,
                args: tc.input,
              }))
            : undefined,
      };
    }
  }

  async generateContentStream(
    model: string,
    params: GenerateParams,
  ): Promise<any> {
    const provider = getProviderForModel(model);
    if (provider === "gemini") {
      const key = getCustomApiKey("gemini") || process.env.GEMINI_API_KEY;
      if (!key) throw new Error("No Gemini API key available.");
      const ai = new GoogleGenAI({ apiKey: key });
      return await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: params.config,
      });
    }

    const result = await this.generateContent(model, params);
    /**
     *
     */
    async function* dummyStream() {
      yield result;
    }
    return dummyStream();
  }
}

// Ensure withModelFallback replaces withKeyRotation
/**
 * The central AI abstraction layer orchestrating requests across multiple providers.
 * @param operation The operation to execute using the AI client
 * @param config Determines the tier (fast or pro) for smart routing
 * @param timeoutMs Timeout in milliseconds
 * @description
 * Exposes a unified API for generating structured content and chats, hiding the
 * underlying SDK complexities (OpenAI, Gemini, Anthropic) from the UI. Features
 * built-in fallback loops that cycle through user-selected models if the primary
 * provider fails or rate-limits.
 * @example
 * ```ts
 * const result = await withModelFallback(async (ai, model) => ai.generateContent(model, { contents: "Hello" }), { tier: 'fast' });
 * ```
 * @throws {Error} Throws if all configured models exhaust their retries or if the
 * underlying network request (e.g. Gemini `504 Timeout`) fails universally.
 */
export const withModelFallback = async <T>(
  operation: (ai: any, model: string) => Promise<T>,
  config: { tier: "fast" | "pro" } = { tier: "fast" },
  timeoutMs: number = 120000,
): Promise<T> => {
  const mainModel = getMainModel();

  let modelsToTry: string[] = [];

  if (mainModel !== "auto") {
    modelsToTry = [mainModel];
  } else {
    // Smart Routing Logic based on Tier
    const tierModels = config.tier === "pro" ? proModels : fastModels;

    // Prioritize models that have custom API keys configured
    const modelsWithKeys = tierModels.filter((model) => {
      const provider = getProviderForModel(model);
      return getCustomApiKey(provider) !== null;
    });

    const fallbackModels = tierModels.filter((model) => {
      const provider = getProviderForModel(model);
      return (
        getCustomApiKey(provider) === null &&
        provider === "gemini" &&
        process.env.GEMINI_API_KEY
      );
    });

    modelsToTry = [...modelsWithKeys, ...fallbackModels];

    if (modelsToTry.length === 0) {
      // Fallback if no keys are found at all, but gemini might have env
      modelsToTry = tierModels;
    }
  }

  if (modelsToTry.length === 0)
    throw new Error("No AI models available for routing");

  let lastError: any = null;
  const aiClient = new AIClient();

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const provider = getProviderForModel(model);
    let key: string | null = null;

    if (provider === "gemini")
      key = getCustomApiKey("gemini") || process.env.GEMINI_API_KEY || null;
    else if (provider === "openai") key = getCustomApiKey("openai");
    else if (provider === "anthropic") key = getCustomApiKey("anthropic");

    if (!key) {
      console.warn(`Skipping model ${model} - no API key available.`);
      if (i === modelsToTry.length - 1 && !lastError) {
        throw new Error(
          `No API key available for any of the configured models.`,
        );
      }
      continue;
    }

    try {
      /**
       *
       */
      const executeWithTimeout = async (): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          }, timeoutMs);

          operation(aiClient, model)
            .then((result) => {
              clearTimeout(timer);
              resolve(result);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });
      };

      const result = await executeWithTimeout();
      trackRequest(provider, key, false, model);
      return result;
    } catch (error: any) {
      trackRequest(provider, key!, true, model);
      console.error(`Error with model ${model} (Fallback Level ${i}):`, error);
      lastError = error;

      const errorStr =
        typeof error === "string"
          ? error
          : JSON.stringify(error, Object.getOwnPropertyNames(error));

      // Fast fail for 400 Bad Request
      if (
        errorStr.includes("400") ||
        errorStr.toLowerCase().includes("bad request")
      ) {
        throw error;
      }

      // Enhance quota/rate limit errors for upstream handling
      if (
        errorStr.includes("429") ||
        errorStr.includes("quota") ||
        errorStr.includes("rate limit") ||
        errorStr.includes("Resource has been exhausted")
      ) {
        error.isRateLimit = true;
      }

      // Only continue to the next model if it's NOT a timeout or a clear parsing error
      // Actually, falling back on 429s or 500s is the exact point of the fallback logic.
    }
  }

  if (lastError) {
    if (lastError.isRateLimit) {
      const customKeyUsed = getCustomApiKey(
        getProviderForModel(modelsToTry[modelsToTry.length - 1]),
      );
      if (customKeyUsed)
        lastError.message = "RateLimit:CustomKey:" + lastError.message;
      else lastError.message = "RateLimit:GlobalKey:" + lastError.message;
    }
    throw lastError;
  }

  throw new Error("All configured models failed or no valid keys available.");
};
