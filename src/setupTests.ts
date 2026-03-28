import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./test-utils/server";

process.env.GEMINI_API_KEY = "test-mock-key";

expect.extend(matchers);

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
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});
