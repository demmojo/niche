import { getApp } from "firebase/app";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";

let appCheckInstance: any = null;

export const initAppCheck = () => {
  if (typeof window !== "undefined" && !appCheckInstance) {
    try {
      const app = getApp();
      // Only initialize if we have a recaptcha site key
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        appCheckInstance = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
    } catch (e) {
      console.warn("AppCheck initialization failed:", e);
    }
  }
  return appCheckInstance;
};

export const getAppCheckToken = async (): Promise<string | null> => {
  try {
    const appCheck = appCheckInstance || initAppCheck();
    if (!appCheck) return null;

    const tokenResponse = await getToken(appCheck, false);
    return tokenResponse.token;
  } catch (error) {
    console.warn("Failed to get AppCheck token:", error);
    return null;
  }
};

export const fetchWithAppCheck = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const headers = new Headers(options.headers || {});

  if (process.env.NODE_ENV !== "test") {
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken) {
      headers.set("X-Firebase-AppCheck", appCheckToken);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
