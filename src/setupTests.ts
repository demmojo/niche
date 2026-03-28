import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./test-utils/server";
import { testVisualKnowledgeStore } from "./store/visualKnowledgeStore";

process.env.GEMINI_API_KEY = "test-mock-key";

expect.extend(matchers);

const initialVisualKnowledgeState = testVisualKnowledgeStore.getState();

// Setup MSW for all tests
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
  vi.clearAllTimers();
  // Reset Zustand state to prevent leakage between tests
  testVisualKnowledgeStore.setState(initialVisualKnowledgeState, true);
});

afterAll(() => {
  server.close();
});
