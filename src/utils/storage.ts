/**
 *
 */
export const setOnboardingState = (key: string, value: string) => {
  localStorage.setItem(key, value);
  // Dispatch native storage event for cross-tab, and a custom event for the current tab
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("local-storage-update", { detail: { key, value } }),
  );
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
