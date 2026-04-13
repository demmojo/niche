import { getApp } from "firebase/app";
import { auth } from "../firebase";
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
  const signal = options.signal;

  const isMockAuth =
    typeof window !== "undefined" &&
    (window.name === "playwright-test" || false);
  if (isMockAuth) {
    headers.set("Authorization", "Bearer MOCK_TOKEN");
  }

  if (process.env.NODE_ENV !== "test" && !isMockAuth) {
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken) {
      headers.set("X-Firebase-AppCheck", appCheckToken);
    }

    if (auth.currentUser) {
      let idToken: string | null = null;
      let attempt = 0;
      const maxAttempts = 3;
      const maxDuration = 5000;
      const startTime = Date.now();

      while (attempt < maxAttempts) {
        if (!auth.currentUser) {
          throw new Error("auth/unauthenticated");
        }

        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        try {
          idToken = await auth.currentUser.getIdToken(false);
          break; // Success
        } catch (authError: any) {
          attempt++;

          const isTransient =
            authError?.code === "auth/network-request-failed" ||
            authError?.code === "auth/internal-error" ||
            authError?.message?.includes("network");

          if (!isTransient) {
            throw authError; // Hard error, bubble up immediately
          }

          if (attempt >= maxAttempts || Date.now() - startTime >= maxDuration) {
            throw authError; // Circuit breaker tripped
          }

          const delayMs = 500 * Math.pow(2, attempt - 1);

          await new Promise<void>((resolve, reject) => {
            let timeoutId: any;

            const onAbort = () => {
              clearTimeout(timeoutId);
              reject(new DOMException("Aborted", "AbortError"));
            };

            if (signal) {
              signal.addEventListener("abort", onAbort, { once: true });
            }

            timeoutId = setTimeout(() => {
              if (signal) {
                signal.removeEventListener("abort", onAbort);
              }
              resolve();
            }, delayMs);
          });
        }
      }

      if (idToken) {
        headers.set("Authorization", `Bearer ${idToken}`);
      }
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
