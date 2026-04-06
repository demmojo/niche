/**
 *
 */
export const setOnboardingState = (key: string, value: string) => {
  safeStorageSet(key, value);
  if (typeof window !== "undefined") {
    // Dispatch native storage event for cross-tab, and a custom event for the current tab
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("local-storage-update", { detail: { key, value } }),
    );
  }
};

/**
 *
 */
export const subscribeToStorage = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("local-storage-update", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("local-storage-update", listener);
  };
};

export function safeStorageSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage setItem failed for key: ${key}`, e);
  }
}

export function safeStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn(`localStorage getItem failed for key: ${key}`, e);
    return null;
  }
}

export function safeSessionStorageSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn(`sessionStorage setItem failed for key: ${key}`, e);
  }
}

export function safeSessionStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch (e) {
    console.warn(`sessionStorage getItem failed for key: ${key}`, e);
    return null;
  }
}

export function safeSessionStorageRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (e) {
    console.warn(`sessionStorage removeItem failed for key: ${key}`, e);
  }
}
