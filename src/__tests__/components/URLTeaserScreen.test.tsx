import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { URLTeaserScreen } from "../../components/URLTeaserScreen";
import React from "react";
import * as fetchUtils from "../../utils/fetchWithAppCheck";

describe("URLTeaserScreen", () => {
  beforeEach(() => {
    vi.spyOn(fetchUtils, "fetchWithAppCheck");
  });

  it("renders initial loading state and expands with streamed data", async () => {
    const encoder = new TextEncoder();
    let controllerRef: any;
    const mockStream = new ReadableStream({
      start(controller) {
        controllerRef = controller;
        controller.enqueue(
          encoder.encode(
            'data: {"type": "status", "value": "Fetching page..."}\n\n',
          ),
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
        <URLTeaserScreen url="https://example.com" onComplete={() => {}} />,
      );
    });

    expect(screen.getByText(/Analyzing URL/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Fetching page...")).toBeInTheDocument();
    });

    await act(async () => {
      controllerRef.enqueue(
        encoder.encode(
          'data: {"type": "metadata", "value": {"title": "Test Title"}}\n\n',
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Reading: Test Title")).toBeInTheDocument();
    });

    await act(async () => {
      controllerRef.enqueue(
        encoder.encode(
          'data: {"type": "teaser", "value": {"jtbd": {"job_statement": "Do X"}, "orthogonal_pivots": ["Pivot A", "Pivot B"]}}\n\n',
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/"Do X"/i)).toBeInTheDocument();
      expect(screen.getByText("Pivot A")).toBeInTheDocument();
      expect(
        screen.getByText("Sign Up to Generate Full Strategy"),
      ).toBeInTheDocument();
    });
  });

  it("shows error state when stream fails", async () => {
    (fetchUtils.fetchWithAppCheck as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: "PQL limit exceeded" }),
    });

    await act(async () => {
      render(
        <URLTeaserScreen url="https://example.com" onComplete={() => {}} />,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Analysis Failed")).toBeInTheDocument();
      expect(screen.getByText("PQL limit exceeded")).toBeInTheDocument();
    });
  });
});
