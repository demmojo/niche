import { terminate, clearIndexedDbPersistence } from "firebase/firestore";
import { deleteApp } from "firebase/app";

if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "SECURITY FAULT: Emulator setup loaded outside of test environment.",
  );
}

// Isolate DB per worker to unblock Vitest parallelism
const poolId = encodeURIComponent(process.env.VITEST_POOL_ID || "default");
export const testProjectId = `demo-nicheai-test-${poolId}`;

// Set the global project ID so firebase-admin initializes to the same project
process.env.GCLOUD_PROJECT = testProjectId;
process.env.FIREBASE_PROJECT_ID = testProjectId;

export const authHost =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
export const firestoreHost =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

export const teardownFirebase = async () => {
  // Clear isolated Firestore & Auth data using REST
  await fetch(
    `http://${firestoreHost}/emulator/v1/projects/${testProjectId}/databases/(default)/documents`,
    { method: "DELETE" },
  ).catch(() => {});
  await fetch(
    `http://${authHost}/emulator/v1/projects/${testProjectId}/accounts`,
    { method: "DELETE" },
  ).catch(() => {});

  try {
    const { getDbInstance, getAppInstance } = await import("../firebase");
    const db = getDbInstance();
    await terminate(db);
    // Even though we use memoryLocalCache, attempt clear IndexedDB just in case other initializations happened
    await clearIndexedDbPersistence(db).catch(() => {});

    const app = getAppInstance();
    await deleteApp(app);
  } catch (e) {
    // Ignore error if already terminated or failed
  }

  // CRITICAL: Prevent JSDOM memory leak per AGENTS.md
  delete (globalThis as any).firestoreInstance;
};
