import { initializeApp, getApp, deleteApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  setLogLevel,
  disableNetwork,
  memoryLocalCache,
  initializeFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

/**
 *
 */
const getApiKey = () => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_FIREBASE_API_KEY
  ) {
    return import.meta.env.VITE_FIREBASE_API_KEY;
  }
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_FIREBASE_API_KEY
  ) {
    return process.env.VITE_FIREBASE_API_KEY;
  }
  return "mock-api-key"; // Provide a fallback for CI/Emulators
};

const getProjectId = () => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  ) {
    return import.meta.env.VITE_FIREBASE_PROJECT_ID;
  }
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_FIREBASE_PROJECT_ID
  ) {
    return process.env.VITE_FIREBASE_PROJECT_ID;
  }
  // Default to the provided new project
  return "gtmforge-45e57";
};

const getAuthDomain = () => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  ) {
    return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  }
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_FIREBASE_AUTH_DOMAIN
  ) {
    return process.env.VITE_FIREBASE_AUTH_DOMAIN;
  }
  return `${getProjectId()}.firebaseapp.com`;
};

const isTestEnv =
  typeof process !== "undefined" && process.env.NODE_ENV === "test";

const configToUse = {
  apiKey: getApiKey(),
  authDomain: getAuthDomain(),
  projectId: getProjectId(),
  ...(isTestEnv
    ? {
        projectId: `demo-nicheai-test-${process.env.VITEST_POOL_ID || "default"}`,
      }
    : {}),
};

const defaultApp = initializeApp(configToUse);

const defaultDb = isTestEnv
  ? initializeFirestore(defaultApp, { localCache: memoryLocalCache() })
  : getFirestore(defaultApp);

const defaultAuth = getAuth(defaultApp);

if (
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true"
) {
  connectFirestoreEmulator(defaultDb, "127.0.0.1", 8080);
  connectAuthEmulator(defaultAuth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
}

// Suppress internal Firestore logs, especially for quota exceeded errors
setLogLevel("silent");

// Track active impersonation app
let impersonationApp: any = null;

export const getAppInstance = () => defaultApp;
export const getDbInstance = () => defaultDb;

// Proxy objects that forward to the impersonation app if it exists, otherwise default app
export const db = new Proxy(defaultDb, {
  get(target, prop) {
    const activeDb = impersonationApp ? getFirestore(impersonationApp) : target;
    const value = activeDb[prop as keyof typeof defaultDb];
    if (typeof value === "function") {
      return value.bind(activeDb);
    }
    return value;
  },
});

export const auth = new Proxy(defaultAuth, {
  get(target, prop) {
    const activeAuth = impersonationApp ? getAuth(impersonationApp) : target;
    const value = activeAuth[prop as keyof typeof defaultAuth];
    if (typeof value === "function") {
      return value.bind(activeAuth);
    }
    return value;
  },
});

const IMPERSONATION_TOKEN_KEY = "niche_impersonation_token";

export const startImpersonation = async (customToken: string) => {
  if (impersonationApp) {
    await stopImpersonation();
  }
  impersonationApp = initializeApp(configToUse, "impersonation-session");
  const impAuth = getAuth(impersonationApp);
  await signInWithCustomToken(impAuth, customToken);

  sessionStorage.setItem(IMPERSONATION_TOKEN_KEY, customToken);
  (window as any).__niche_impersonating = true;
  // Re-trigger auth state listeners
  window.dispatchEvent(new Event("auth-state-changed"));
};

export const stopImpersonation = async () => {
  if (impersonationApp) {
    const appToDelete = impersonationApp;
    impersonationApp = null;
    await signOut(getAuth(appToDelete));
    await deleteApp(appToDelete);
    sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
    (window as any).__niche_impersonating = false;
    window.dispatchEvent(new Event("auth-state-changed"));
  }
};

// Check for existing impersonation session on boot
if (typeof window !== "undefined") {
  const existingToken = sessionStorage.getItem(IMPERSONATION_TOKEN_KEY);
  if (existingToken) {
    // We don't await this so it doesn't block boot, but it means the app might render briefly as the admin.
    // In a real robust implementation, we would wait for this in the AuthProvider.
    startImpersonation(existingToken).catch(() => {
      sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
    });
  }
}

let isNetworkDisabled = false;
let disableNetworkPromise: Promise<void> | null = null;

/**
 *
 */
export const safeDisableNetwork = async () => {
  if (isNetworkDisabled) return;
  if (disableNetworkPromise) return disableNetworkPromise;

  try {
    disableNetworkPromise = disableNetwork(db);
    await disableNetworkPromise;
    isNetworkDisabled = true;
    console.warn(
      "Firestore network disabled due to quota limits. Falling back to local storage.",
    );
  } catch (error) {
    console.error("Failed to disable Firestore network:", error);
  } finally {
    disableNetworkPromise = null;
  }
};

/**
 *
 */
export const loginWithGoogle = async (
  isMergingRef?: React.MutableRefObject<boolean>,
) => {
  const provider = new GoogleAuthProvider();
  try {
    if (auth.currentUser?.isAnonymous) {
      if (isMergingRef) isMergingRef.current = true;
      try {
        const { linkWithPopup } = await import("firebase/auth");
        await linkWithPopup(auth.currentUser, provider);
        await auth.currentUser?.reload();
        await auth.currentUser?.getIdToken(true);
      } catch (linkError: any) {
        console.warn("Linking failed, falling back to sign in:", linkError);
        if (linkError.code === "auth/credential-already-in-use") {
          const { OAuthProvider, signInWithCredential } =
            await import("firebase/auth");
          const credential = OAuthProvider.credentialFromError(linkError);
          if (credential) {
            await signInWithCredential(auth, credential);
          } else {
            await signInWithPopup(auth, provider);
          }
        } else {
          await signInWithPopup(auth, provider);
        }
        await auth.currentUser?.getIdToken(true);
      }
    } else {
      await signInWithPopup(auth, provider);
      await auth.currentUser?.getIdToken(true);
    }
  } catch (error) {
    if (isMergingRef) isMergingRef.current = false;
    console.error("Error signing in with Google", error);
    throw error;
  } finally {
    if (isMergingRef) isMergingRef.current = false;
  }
};

/**
 *
 */
export const loginWithEmail = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-credential" ||
      error.code === "auth/invalid-login-credentials" ||
      !error.code
    ) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (createError) {
        throw createError;
      }
    } else {
      throw error;
    }
  }
};

/**
 *
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
