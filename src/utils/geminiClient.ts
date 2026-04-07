import { GoogleGenAI } from "@google/genai";
import { trackRequest } from "./usageTracker";
import { getCustomApiKey } from "./apiKeys";

/**
 *
 */
export const getGeminiKeys = (): string[] => {
  const customKey = getCustomApiKey("gemini");
  const envKey = process.env.GEMINI_API_KEY;
  const keys = [];
  if (customKey) keys.push(customKey);
  if (envKey && !customKey) keys.push(envKey);
  return keys;
};

/**
 *
 * @param key
 */
export const addGeminiKey = (key: string) => {
  // No-op: API keys are managed by the platform
};

/**
 *
 * @param key
 */
export const removeGeminiKey = (key: string) => {
  // No-op: API keys are managed by the platform
};

import { safeStorageGet, safeStorageSet } from "./storage";

/**
 *
 */
export const getSelectedModel = (): string => {
  return safeStorageGet("gemini_selected_model") || "gemini-3.1-flash";
};

/**
 *
 * @param model
 */
export const setSelectedModel = (model: string) => {
  safeStorageSet("gemini_selected_model", model);
};

/**
 *
 */
export const getGeminiClient = () => {
  const key = getCustomApiKey("gemini") || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "No Gemini API key available. Please configure it in the AI Studio Settings.",
    );
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 *
 */
export const rotateGeminiKey = () => {
  return false;
};

/**
 * A resilient client wrapper for the Google GenAI (Gemini) SDK.
 * @param operation
 * @param timeoutMs
 * @description
 * This client manages multiple API keys, automatic model fallbacks, rate limiting, and
 * structured JSON extraction. It uses an exponential backoff retry mechanism to ensure
 * requests succeed even under heavy load.
 * @example
 * ```ts
 * const result = await withModelFallback(
 *   async (ai, model) => await ai.generateContent(model, { contents: prompt }),
 *   120000
 * );
 * ```
 * @throws {Error} Throws \`Error\` if all retries and fallbacks fail, or if a \`429 Rate Limit\`
 * is hit and \`fallbackToLite\` is disabled.
 */
export const withKeyRotation = async <T>(
  operation: (
    ai: GoogleGenAI,
    model: string,
    signal?: AbortSignal,
  ) => Promise<T>,
  timeoutMs: number = 120000,
): Promise<T> => {
  const key = getCustomApiKey("gemini") || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "No Gemini API key available. Please configure it in the AI Studio Settings.",
    );
  }

  let currentModel = getSelectedModel();
  const ai = new GoogleGenAI({ apiKey: key });

  /**
   *
   */
  const executeWithTimeout = async (model: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation(ai, model, controller.signal)
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

  /**
   *
   */
  const formatError = (err: any) => {
    let msg = "";
    if (typeof err === "string") {
      msg = err;
    } else if (err && err.message && typeof err.message === "string") {
      msg = err.message;
    }

    try {
      if (msg.startsWith("{")) {
        const parsed = JSON.parse(msg);
        if (parsed.error && parsed.error.message) {
          msg = parsed.error.message;
        }
      }
    } catch (e) {
      // ignore JSON parse error
    }

    if (
      msg.includes("quota") ||
      msg.includes("429") ||
      msg.includes("RESOURCE_EXHAUSTED")
    ) {
      msg =
        "API Quota Exceeded. Please check your Gemini API plan or try again later. " +
        msg;
    } else if (
      msg.includes("503") ||
      msg.includes("500") ||
      msg.includes("Service Unavailable") ||
      msg.includes("overloaded")
    ) {
      msg =
        "Gemini API is currently experiencing issues or is overloaded. Please try again later. " +
        msg;
    }

    const newErr = new Error(msg || "Unknown error");
    if (err && typeof err === "object") {
      Object.assign(newErr, err);
    }
    return newErr;
  };

  /**
   *
   */
  const doCall = async (model: string, maxRetries: number) => {
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        const result = await executeWithTimeout(model);
        trackRequest("gemini", key, false, model, undefined);
        return result;
      } catch (error: any) {
        trackRequest("gemini", key, true, model, undefined);

        const errorStr =
          typeof error === "string"
            ? error
            : JSON.stringify(error, Object.getOwnPropertyNames(error));

        const isRateLimit =
          error?.status === 429 ||
          errorStr.includes("429") ||
          errorStr.includes("quota") ||
          errorStr.includes("rate limit") ||
          errorStr.includes("Resource has been exhausted");

        const isTimeout = errorStr.includes("timed out");

        const isServerError =
          error?.status >= 500 ||
          errorStr.includes("500") ||
          errorStr.includes("503") ||
          errorStr.includes("Failed to call the Gemini API");

        if (
          (isRateLimit || isTimeout || isServerError) &&
          attempts < maxRetries
        ) {
          attempts++;
          const backoffMs = Math.min(
            1000 * Math.pow(2, attempts) + Math.random() * 500,
            5000,
          );
          console.warn(
            `Error on model ${model} (${isRateLimit ? "429" : "Server/Timeout"}). Backing off for ${backoffMs}ms before retry...`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        throw {
          error,
          formatError: formatError(error),
          isRateLimit,
          isTimeout,
          isServerError,
          errorStr,
        };
      }
    }
  };

  try {
    return await doCall(currentModel, 2);
  } catch (errWrapper: any) {
    if (!errWrapper.error) throw errWrapper;

    const {
      formatError: formattedError,
      isRateLimit,
      isTimeout,
      isServerError,
      errorStr,
    } = errWrapper;

    const isNotFound =
      errWrapper.error?.status === 404 ||
      errorStr.includes("404") ||
      errorStr.includes("not found") ||
      errorStr.includes("NOT_FOUND");

    if (isRateLimit || isTimeout || isServerError) {
      if (currentModel !== "gemini-3.1-flash-lite-preview") {
        console.warn(`Falling back to free/lite model...`);
        currentModel = "gemini-3.1-flash-lite-preview";
        try {
          return await doCall(currentModel, 0);
        } catch (fallbackErrWrapper: any) {
          throw (
            fallbackErrWrapper.formatError ||
            formatError(fallbackErrWrapper.error || fallbackErrWrapper)
          );
        }
      }
    } else if (isNotFound) {
      console.warn(
        `Model ${currentModel} not found. Falling back to gemini-3.1-flash...`,
      );
      currentModel = "gemini-3.1-flash";
      try {
        return await doCall(currentModel, 0);
      } catch (fallbackErrWrapper: any) {
        throw (
          fallbackErrWrapper.formatError ||
          formatError(fallbackErrWrapper.error || fallbackErrWrapper)
        );
      }
    }

    throw formattedError;
  }
};
