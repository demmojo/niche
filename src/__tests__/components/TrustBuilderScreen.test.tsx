import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrustBuilderScreen } from "../../components/TrustBuilderScreen";
import React from "react";
import { AuthDialogProvider } from "../../components/AuthDialogProvider";
import { http, HttpResponse } from "msw";
import { server } from "../../test-utils/server";
import * as AuthProvider from "../../components/AuthProvider";

// Provide dummy user for AppCheck/auth to pass
vi.mock("../../firebase", () => ({
  auth: { currentUser: { uid: "test-user", getIdToken: async () => "token" } },
  db: {},
}));

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("TrustBuilderScreen Intent Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates MSW payload contract for Core MVP action", async () => {
    vi.mocked(AuthProvider.useAuth).mockReturnValue({
      user: { uid: "test-user", isAnonymous: false },
    } as any);
    let capturedBody: any;

    server.use(
      http.post("/api/scoring/stream", async ({ request }) => {
        capturedBody = await request.json();

        // Strict payload validation
        if (!capturedBody.productName || !capturedBody.productDescription) {
          return new HttpResponse(
            JSON.stringify({ error: "Invalid payload" }),
            { status: 400 },
          );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                'data: {"type": "tarpit_score", "value": {"score": 85, "isTarpit": true}}\n\n',
              ),
            );
            controller.enqueue(
              encoder.encode(
                'data: {"type": "final", "value": {"reasoning": "Test Strategy"}}\n\n',
              ),
            );
            controller.close();
          },
        });

        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    render(
      <AuthDialogProvider>
        <TrustBuilderScreen
          ideaPayload={{
            productName: "Test Product",
            productDescription: "Test Description",
          }}
          onComplete={() => {}}
        />
      </AuthDialogProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Tarpit Risk Score: 85/i)).toBeInTheDocument();
    });

    // Enforce strict payload contracts at the network boundary
    expect(capturedBody).toEqual({
      productName: "Test Product",
      productDescription: "Test Description",
    });
  });

  it("intercepts PQL Gate and shows teaser modal for unauthenticated users", async () => {
    // Override auth to be anonymous for this test
    vi.mocked(AuthProvider.useAuth).mockReturnValue({
      user: { uid: "anon", isAnonymous: true },
    } as any);

    server.use(
      http.post("/api/scoring/stream", async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode('data: {"type": "pql_gate"}\n\n'),
            );
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    render(
      <AuthDialogProvider>
        <TrustBuilderScreen
          ideaPayload={{
            productName: "Test PQL",
            productDescription: "PQL Description",
          }}
          onComplete={() => {}}
        />
      </AuthDialogProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Sign up to unlock full analysis/i),
      ).toBeInTheDocument();
    });

    const unlockBtn = screen.getByRole("button", { name: /Unlock Analysis/i });
    expect(unlockBtn).toBeInTheDocument();
  });
});
