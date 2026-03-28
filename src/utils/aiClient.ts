import { auth } from "../firebase";
import { trackRequest } from "./usageTracker";

export interface GenerateParams {
  contents: string;
  config?: {
    responseMimeType?: string;
    responseSchema?: any;
    tools?: any[];
  };
  sensitive?: boolean;
}

export type Capability = "reasoning" | "chat" | "extraction";

export const liteModels = [
  "gemini-3.1-flash-lite-preview",
  "gpt-4o-mini",
  "claude-3-5-haiku-20241022",
];

export const fastModels = [
  "gemini-3.1-flash",
  "gpt-4o-mini",
  "claude-3-5-haiku-20241022",
];

export const proModels = [
  "gemini-3.1-pro-preview",
  "claude-3-7-sonnet-20250219",
  "gpt-4o",
];

/**
 *
 */
export const getMainModel = (): string => {
  const data = localStorage.getItem("ai_main_model");
  return data || "default-pro";
};

/**
 *
 */
export const setMainModel = (model: string) => {
  localStorage.setItem("ai_main_model", model);
};

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

/**
 *
 */
export const fetchAvailableModels = async (): Promise<AIModel[]> => {
  const models: AIModel[] = [];
  [
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash",
    "gemini-3.1-flash-lite-preview",
  ].forEach((id) =>
    models.push({ id, name: `Google: ${id}`, provider: "gemini" }),
  );

  ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"].forEach((id) =>
    models.push({ id, name: `OpenAI: ${id}`, provider: "openai" }),
  );

  [
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ].forEach((id) =>
    models.push({ id, name: `Anthropic: ${id}`, provider: "anthropic" }),
  );
  return models;
};

/**
 *
 */
class AIClient {
  public lastTokens?: { input: number; output: number };

  async generateContent(
    model: string,
    params: GenerateParams,
    signal?: AbortSignal,
  ): Promise<any> {
    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/llm/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ model, params, sensitive: params.sensitive }),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errObj;
      try {
        errObj = JSON.parse(errorText);
      } catch {
        errObj = { error: errorText };
      }
      const err = new Error(errObj.error || errorText);
      (err as any).status = res.status;
      if (res.status === 429) (err as any).isRateLimit = true;
      throw err;
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(
        `Failed to parse JSON response: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (data.usageMetadata) {
      this.lastTokens = {
        input: data.usageMetadata.promptTokenCount || 0,
        output: data.usageMetadata.candidatesTokenCount || 0,
      };
    }
    return data;
  }

  async generateContentStream(
    model: string,
    params: GenerateParams,
    signal?: AbortSignal,
  ): Promise<any> {
    const result = await this.generateContent(model, params, signal);
    /**
     *
     */
    async function* dummyStream() {
      yield result;
    }
    return dummyStream();
  }
}

/**
 *
 */
const getProviderForModel = (
  modelId: string,
): "gemini" | "openai" | "anthropic" => {
  if (
    modelId.startsWith("gpt-") ||
    modelId.startsWith("o1") ||
    modelId.startsWith("o3")
  )
    return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  return "gemini";
};

/**
 *
 */
export const withModelFallback = async <T>(
  operation: (ai: any, model: string, signal?: AbortSignal) => Promise<T>,
  config: { capability: Capability } = { capability: "chat" },
  timeoutMs: number = 120000,
): Promise<T> => {
  let mainModel = getMainModel();
  if (mainModel === "auto") mainModel = "default-pro";

  let tierProgression: string[][] = [];
  switch (config.capability) {
    case "extraction":
      tierProgression = [liteModels, fastModels];
      break;
    case "chat":
      tierProgression = [fastModels, proModels];
      break;
    case "reasoning":
      tierProgression = [proModels];
      break;
  }

  const allCandidateModels = Array.from(new Set(tierProgression.flat()));
  let modelsToTry =
    mainModel === "default-pro" ? allCandidateModels : [mainModel];
  if (modelsToTry.length === 0) modelsToTry = tierProgression[0];

  const aiClient = new AIClient();

  for (const model of modelsToTry) {
    const provider = getProviderForModel(model);
    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
      try {
        /**
         *
         */
        const executeWithTimeout = async (): Promise<T> => {
          return new Promise<T>((resolve, reject) => {
            const controller = new AbortController();
            const timer = setTimeout(() => {
              controller.abort();
              reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            operation(aiClient, model, controller.signal)
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
        trackRequest(
          provider,
          "backend-cookie",
          false,
          model,
          aiClient.lastTokens,
        );
        return result;
      } catch (error: any) {
        console.error(`Error with model ${model}:`, error);
        trackRequest(
          provider,
          "backend-cookie",
          true,
          model,
          aiClient.lastTokens,
        );

        if (error.status === 429 && attempts < maxRetries) {
          attempts++;
          const backoffMs = Math.min(
            1000 * Math.pow(2, attempts) + Math.random() * 500,
            5000,
          );
          console.warn(
            `429 Rate Limit for model ${model}. Backing off for ${backoffMs}ms before retry...`,
          );
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        // Fast fail for 503 from backend (Penalty Box) or 429 out of retries
        if (error.status === 503 || error.status === 429) {
          break; // The circuit breaker manages limits globally. Proceed to next model.
        }

        break; // Proceed to next model for any other error
      }
    }
  }

  throw new Error("All configured models failed or no valid keys available.");
};
