import React from "react";
import { render, screen, waitFor } from "../../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MindmapAIChat } from "../../../components/whiteboard/MindmapAIChat";
import { useVisualKnowledgeStore } from "../../../store/visualKnowledgeStore";
import * as geminiClient from "../../../utils/geminiClient";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("MindmapAIChat Component", () => {
  let mockWhiteboardId: string;
  let mockCardId: string;

  beforeEach(() => {
    vi.clearAllMocks();

    useVisualKnowledgeStore.setState({
      cards: {},
      whiteboards: {},
      activeWhiteboardId: null,
    });

    const store = useVisualKnowledgeStore.getState();
    mockCardId = store.addCard({
      title: "Strategy Doc",
      content: "Important strategy details here",
      type: "note",
      tags: ["#strategy"],
    });

    mockWhiteboardId = store.createWhiteboard("Test Board");
    store.setActiveWhiteboard(mockWhiteboardId);
  });

  it("renders chat interface and sends a message", async () => {
    const user = userEvent.setup();
    vi.spyOn(geminiClient, "withModelFallback").mockResolvedValue({
      text: "Here is your AI answer",
    });

    render(
      <MindmapAIChat activeWhiteboardId={mockWhiteboardId} onClose={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(
      "Ask AI or type @ to mention tags...",
    );
    await user.type(input, "Hello AI{enter}");

    // Message should appear
    expect(screen.getByText("Hello AI")).toBeInTheDocument();

    // AI response should eventually appear
    await waitFor(() => {
      expect(screen.getByText("Here is your AI answer")).toBeInTheDocument();
    });
  });

  it("triggers mention menu when typing @ and selects a tag", async () => {
    const user = userEvent.setup();
    render(
      <MindmapAIChat activeWhiteboardId={mockWhiteboardId} onClose={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(
      "Ask AI or type @ to mention tags...",
    );

    await user.type(input, "@str");

    // Menu should appear
    await waitFor(() => {
      expect(screen.getByText("#strategy")).toBeInTheDocument();
    });

    // Click the tag
    await user.click(screen.getByText("#strategy"));

    expect(input).toHaveValue("#strategy ");
  });

  it("triggers mention menu for cards and formats them as [[Title]]", async () => {
    const user = userEvent.setup();
    render(
      <MindmapAIChat activeWhiteboardId={mockWhiteboardId} onClose={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(
      "Ask AI or type @ to mention tags...",
    );

    await user.type(input, "@Str");

    await waitFor(() => {
      expect(screen.getByText("Strategy Doc")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Strategy Doc"));

    expect(input).toHaveValue("[[Strategy Doc]] ");
  });

  it("can pin an AI response to the board", async () => {
    const user = userEvent.setup();
    vi.spyOn(geminiClient, "withModelFallback").mockResolvedValue({
      text: "A very good point",
    });

    render(
      <MindmapAIChat activeWhiteboardId={mockWhiteboardId} onClose={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(
      "Ask AI or type @ to mention tags...",
    );
    await user.type(input, "tell me something{enter}");

    await waitFor(() => {
      expect(screen.getByText("A very good point")).toBeInTheDocument();
    });

    const pinBtn = screen.getByText("Pin to Board");
    await user.click(pinBtn);

    // Verify it was added to store
    const state = useVisualKnowledgeStore.getState();
    const wb = state.whiteboards[mockWhiteboardId];
    expect(wb.cardInstances.length).toBe(1);

    const inst = wb.cardInstances[0];
    const card = state.cards[inst.cardId];

    expect(card.type).toBe("insight");
    expect(card.content).toBe("A very good point");
    expect(card.tags).toContain("#ai-insight");
  });

  it("handles error during AI generation", async () => {
    const user = userEvent.setup();
    vi.spyOn(geminiClient, "withModelFallback").mockRejectedValue(
      new Error("Network error"),
    );

    render(
      <MindmapAIChat activeWhiteboardId={mockWhiteboardId} onClose={vi.fn()} />,
    );

    const input = screen.getByPlaceholderText(
      "Ask AI or type @ to mention tags...",
    );
    await user.type(input, "trigger error{enter}");

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
