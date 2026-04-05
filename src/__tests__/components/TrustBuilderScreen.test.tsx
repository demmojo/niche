import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrustBuilderScreen } from "../../components/TrustBuilderScreen";
import React, { Suspense } from "react";
import * as fetchUtils from "../../utils/fetchWithAppCheck";

describe("TrustBuilderScreen", () => {
  beforeEach(() => {
    vi.spyOn(fetchUtils, "fetchWithAppCheck");
  });

  it("renders initial loading state and then expands with streamed data", async () => {
    // Setup a mock stream
    const encoder = new TextEncoder();
    let controllerRef: any;
    const mockStream = new ReadableStream({
      start(controller) {
        controllerRef = controller;
        // Enqueue first chunk
        controller.enqueue(
          encoder.encode('data: {"type": "competitor_count", "value": 42}\n\n'),
        );
      },
    });

    (fetchUtils.fetchWithAppCheck as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: { getReader: () => mockStream.getReader() },
    });

    await act(async () => {
      render(
        <TrustBuilderScreen
          ideaPayload={{
            productName: "Test",
            productDescription: "Test Idea",
          }}
          onComplete={() => {}}
        />,
      );
    });

    // Initial fallbacks should be visible for the ones not resolved yet
    expect(screen.getByText(/Analyzing tarpit risk/i)).toBeInTheDocument();

    // eventually competitor count appears (already there due to immediate mock)
    await waitFor(() => {
      expect(
        screen.getByText(/Found 42 existing solutions/i),
      ).toBeInTheDocument();
    });

    await act(async () => {
      controllerRef.enqueue(
        encoder.encode(
          'data: {"type": "jtbd_analysis", "value": {"job": "Do X", "opportunityScore": 15}}\n\n',
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Customer Jobs Analyzed/i)).toBeInTheDocument();
      expect(screen.getByText(/15 \/ 20/i)).toBeInTheDocument();
    });

    await act(async () => {
      controllerRef.enqueue(
        encoder.encode(
          'data: {"type": "gap_analysis", "value": [{"feature": "Missing X", "competitor_deficit": "They do not have X"}]}\n\n',
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/They do not have X/i)).toBeInTheDocument();
    });

    await act(async () => {
      controllerRef.enqueue(
        encoder.encode(
          'data: {"type": "tarpit_score", "value": {"score": 85, "isTarpit": true}}\n\n',
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Tarpit Risk Score: 85/i)).toBeInTheDocument();
    });
  });
});
