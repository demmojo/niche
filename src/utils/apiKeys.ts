export type ApiService = "gemini" | "apollo" | "exa" | "openai" | "anthropic";

// getCustomApiKey will check if we have a locally cached true/false flag
// to avoid making sync code async, we can just return a non-null string
// if the cookie was set, though technically the actual key is HTTP-Only now.
// For backward compatibility in logic that checks `if (getCustomApiKey('gemini'))`,
// we will just return a placeholder string or rely on localStorage flag.
/**
 *
 */
export const getCustomApiKey = (service: ApiService): string | null => {
  return localStorage.getItem(`custom_api_key_configured_${service}`);
};

/**
 *
 */
export const setCustomApiKey = async (service: ApiService, key: string) => {
  if (key) {
    localStorage.setItem(`custom_api_key_configured_${service}`, "true");

    // Call the backend to set the HttpOnly cookie
    try {
      await fetch("/api/settings/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: service, apiKey: key }),
      });
    } catch (e) {
      console.error(`Failed to set BYOK cookie for ${service}`, e);
    }
  } else {
    localStorage.removeItem(`custom_api_key_configured_${service}`);
  }
};
