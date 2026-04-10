import { logger } from "../logger";
import admin from "firebase-admin";

let cachedModel: string | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getResolvedModel(
  fallback = "gemini-3.1-flash-lite-preview",
): Promise<string> {
  const now = Date.now();
  if (cachedModel && now - lastFetch < CACHE_TTL) {
    return cachedModel;
  }

  try {
    const template = await admin.remoteConfig().getTemplate();
    const modelParam = template.parameters?.["gemini_model_name"];
    if (
      modelParam &&
      modelParam.defaultValue &&
      "value" in modelParam.defaultValue
    ) {
      cachedModel = modelParam.defaultValue.value || fallback;
    } else {
      cachedModel = fallback;
    }
    lastFetch = now;
    return cachedModel;
  } catch (error) {
    logger.error("Failed to fetch Remote Config template:", error);
    if (!cachedModel) {
      cachedModel = fallback;
    }
    return cachedModel;
  }
}
