import "@testing-library/jest-dom";
import { teardownFirebase } from "./test-utils/firebase-setup"; // Import this first to set env vars
import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";

// Provide required env vars
process.env.LAKE_BUCKET_NAME = "test-bucket";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./test-utils/server";
import { testVisualKnowledgeStore } from "./store/visualKnowledgeStore";

process.env.GEMINI_API_KEY = "test-mock-key";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    })),
    onSnapshot: vi.fn(),
    Timestamp: {
      now: vi.fn(() => ({
        toMillis: () => Date.now(),
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      })),
      fromDate: vi.fn((date: Date) => ({
        toMillis: () => date.getTime(),
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      })),
    },
  };
});

expect.extend(matchers);

const initialVisualKnowledgeState = testVisualKnowledgeStore.getState();

// Setup MSW for all tests
const CONSOLE_ERROR_ALLOW_LIST = [
  /ResizeObserver/,
  /The width\(-1\) and height\(-1\) of chart/,
  /Not implemented: navigation \(except hash changes\)/,
  /act\(\.\.\.\) is not supported in production builds/,
  /When testing, code that causes React state updates should be wrapped into act\(\.\.\.\)/,
  /Cannot log after tests are done/,
  /Error analyzing file/,
  /Error saving .* to Firebase/,
  /Error syncing .* from Firebase/,
  /Failed to fetch DLQ items/,
  /Failed to retry DLQ job/,
  /ALERT: DLQ Job .* has reached terminal status/,
  /Failed to send invite/,
  /Failed to submit feedback/,
  /Error processing access request/,
  /Error fetching feature access/,
  /Failed to fetch models/,
  /Failed to analyze features/,
  /API failed/,
  /Failed to process item/,
  /CRITICAL: Failed to write to DLQ!/,
  /WebSocket server error: Port 24678 is already in use/,
  /Error calling Apollo/,
  /API Error/,
  /ECONNREFUSED 127.0.0.1:6379/,
  /ioredis/,
];

if (typeof window !== "undefined") {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
}

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

/**
 *
 */
console.error = (...args: any[]) => {
  const msg =
    typeof args[0] === "string"
      ? args[0]
      : args[0]?.message || args[0]?.toString() || "";
  if (CONSOLE_ERROR_ALLOW_LIST.some((regex) => regex.test(msg))) {
    return;
  }
  originalConsoleError(...args);
};

/**
 *
 */
console.warn = (...args: any[]) => {
  const msg =
    typeof args[0] === "string"
      ? args[0]
      : args[0]?.message || args[0]?.toString() || "";
  if (CONSOLE_ERROR_ALLOW_LIST.some((regex) => regex.test(msg))) {
    return;
  }
  originalConsoleWarn(...args);
};

beforeAll(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-mock-key");
  server.listen({
    onUnhandledRequest(request) {
      console.warn("Unhandled request:", request.method, request.url);
    },
  });
});

afterEach(() => {
  cleanup();
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
  }
  server.resetHandlers();
  vi.clearAllMocks();
  try {
    vi.runOnlyPendingTimers();
  } catch (e) {
    // Ignored if fake timers aren't active
  }
  vi.useRealTimers();
  // Reset Zustand state to prevent leakage between tests
  testVisualKnowledgeStore.setState(initialVisualKnowledgeState, true);
});

afterAll(async () => {
  server.close();
  await teardownFirebase();

  // Hard fallback for CI memory leaks, independent of teardownFirebase internals
  try {
    const { getApp, deleteApp } = await import("firebase/app");
    const app = getApp();
    if (app) await deleteApp(app);
  } catch (e) {
    // Ignore if no default app
  }

  try {
    const admin = await import("firebase-admin");
    if (admin.apps && admin.apps.length > 0) {
      await Promise.all(
        admin.apps.map((app) => (app ? app.delete() : Promise.resolve())),
      );
    }
  } catch (e) {
    // Ignore
  }

  delete (globalThis as any).firestoreInstance;

  // Expose GC hook allows us to clear up V8 memory limits caused by JsDOM
  if (typeof global.gc === "function") {
    global.gc();
  }
});
