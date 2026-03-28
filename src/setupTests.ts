import "@testing-library/jest-dom";
import { teardownFirebase } from "./test-utils/firebase-setup"; // Import this first to set env vars
import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./test-utils/server";
import { testVisualKnowledgeStore } from "./store/visualKnowledgeStore";

process.env.GEMINI_API_KEY = "test-mock-key";

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
});
