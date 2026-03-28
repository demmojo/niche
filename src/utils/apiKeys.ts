export type ApiService = 'gemini' | 'apollo' | 'exa' | 'openai' | 'anthropic';

export const getCustomApiKey = (service: ApiService): string | null => {
  return localStorage.getItem(`custom_api_key_${service}`);
};

export const setCustomApiKey = (service: ApiService, key: string) => {
  if (key) {
    localStorage.setItem(`custom_api_key_${service}`, key);
  } else {
    localStorage.removeItem(`custom_api_key_${service}`);
  }
};
