import { safeStorageGet, safeStorageSet } from "./storage";

const ALPHA_LIMIT_KEY = "nicheai_alpha_usage";

/**
 *
 */
export const checkAlphaLimit = (): boolean => {
  const today = new Date().toISOString().split("T")[0];
  const data = safeStorageGet(ALPHA_LIMIT_KEY);

  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.date === today && parsed.count >= 1) {
        return false; // Limit reached
      }
    } catch (e) {
      console.error("Failed to parse alpha limit", e);
    }
  }
  return true; // Under limit
};

/**
 *
 */
export const recordAlphaUsage = () => {
  const today = new Date().toISOString().split("T")[0];
  let count = 0;
  const data = safeStorageGet(ALPHA_LIMIT_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.date === today) {
        count = parsed.count;
      }
    } catch (e) {}
  }

  safeStorageSet(
    ALPHA_LIMIT_KEY,
    JSON.stringify({
      date: today,
      count: count + 1,
    }),
  );
};
