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

/**
 *
 */
export const getSelectedModel = (): string => {
  return (
    localStorage.getItem("gemini_selected_model") || "gemini-3-flash-preview"
  );
};

/**
 *
 * @param model
 */
export const setSelectedModel = (model: string) => {
  localStorage.setItem("gemini_selected_model", model);
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
  operation: (ai: GoogleGenAI, model: string) => Promise<T>,
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
   * @param model
   */
  const executeWithTimeout = async (model: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation(ai, model)
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

  try {
    const result = await executeWithTimeout(currentModel);
    trackRequest("gemini", key, false, currentModel);
    return result;
  } catch (error: any) {
    trackRequest("gemini", key, true, currentModel);

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
    const isNotFound =
      error?.status === 404 ||
      errorStr.includes("404") ||
      errorStr.includes("not found") ||
      errorStr.includes("NOT_FOUND");
    const isTimeout = errorStr.includes("timed out");
    const isServerError =
      error?.status >= 500 ||
      errorStr.includes("500") ||
      errorStr.includes("503") ||
      errorStr.includes("Failed to call the Gemini API");

    /**
     *
     * @param err
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
        // ignore
      }

      // Add a friendly note for quota errors
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
      // Copy other properties if it's an object
      if (err && typeof err === "object") {
        Object.assign(newErr, err);
      }
      return newErr;
    };

    if (isRateLimit || isTimeout || isServerError) {
      console.warn(
        `Retrying due to ${isTimeout ? "timeout" : isRateLimit ? "rate limit" : "server error"}...`,
      );

      if (
        (isRateLimit || isTimeout || isServerError) &&
        currentModel !== "gemini-3.1-flash-lite-preview"
      ) {
        console.warn(`Falling back to free/lite model...`);
        currentModel = "gemini-3.1-flash-lite-preview";
      }

      // Add a delay before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const result = await executeWithTimeout(currentModel);
        trackRequest("gemini", key, false, currentModel);
        return result;
      } catch (fallbackError) {
        trackRequest("gemini", key, true, currentModel);
        throw formatError(fallbackError);
      }
    } else if (isNotFound) {
      console.warn(
        `Model ${currentModel} not found. Falling back to gemini-3-flash-preview...`,
      );
      currentModel = "gemini-3-flash-preview";

      try {
        const result = await executeWithTimeout(currentModel);
        trackRequest("gemini", key, false, currentModel);
        return result;
      } catch (fallbackError) {
        trackRequest("gemini", key, true, currentModel);
        throw formatError(fallbackError);
      }
    }

    throw formatError(error);
  }
};
