import React from "react";
import { render, screen, fireEvent, act } from "../../../test-utils/render";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomCardNode } from "../../../components/whiteboard/CustomCardNode";
import { useVisualKnowledgeStore } from "../../../store/visualKnowledgeStore";

// Mock React Flow Handle
vi.mock("@xyflow/react", () => ({
  Handle: () => <div data-testid="rf-handle" />,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

describe("CustomCardNode Component", () => {
  let mockCardId: string;
  let mockInstanceId = "inst-1";
  let mockWhiteboardId: string;

  beforeEach(() => {
    // Reset Zustand store
    useVisualKnowledgeStore.setState({
      cards: {},
      whiteboards: {},
      activeWhiteboardId: null,
    });

    // Setup initial data
    const store = useVisualKnowledgeStore.getState();
    mockCardId = store.addCard({
      title: "Initial Card",
      content: "Initial Content",
      type: "insight",
      tags: ["#initial"],
    });

    mockWhiteboardId = store.createWhiteboard("Test Board");
    store.placeCardOnWhiteboard(mockWhiteboardId, mockCardId, { x: 0, y: 0 });

    // Grab the instance id directly from the store
    const updatedStore = useVisualKnowledgeStore.getState();
    mockInstanceId =
      updatedStore.whiteboards[mockWhiteboardId].cardInstances[0].id;
  });

  const renderComponent = () => {
    const data = {
      instanceId: mockInstanceId,
      cardId: mockCardId,
      whiteboardId: mockWhiteboardId,
    };
    return render(<CustomCardNode data={data} />);
  };

  it("renders correctly with insight type styling", () => {
    renderComponent();
    expect(screen.getByText("Initial Card")).toBeInTheDocument();
    expect(screen.getByText("Initial Content")).toBeInTheDocument();
    expect(screen.getByText("#initial")).toBeInTheDocument();

    // Check type uppercase text
    expect(screen.getByText("insight")).toBeInTheDocument();
  });

  it("handles adding a tag", () => {
    renderComponent();

    const addTagBtn = screen.getByTestId("add-tag-btn");
    fireEvent.click(addTagBtn);

    const input = screen.getByPlaceholderText("#tag...");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "newtag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // The tag #newtag should now be visible
    expect(screen.getByText("#newtag")).toBeInTheDocument();
  });

  it("handles removing a tag", () => {
    renderComponent();

    const removeTagBtn = screen.getByTestId("remove-tag-#initial");
    fireEvent.click(removeTagBtn);

    expect(screen.queryByText("#initial")).not.toBeInTheDocument();
  });

  it("handles removing the node from whiteboard", () => {
    renderComponent();

    const removeNodeBtn = screen.getByTestId("remove-node-btn");
    fireEvent.click(removeNodeBtn);

    // Check store to see if it was removed
    const store = useVisualKnowledgeStore.getState();
    expect(store.whiteboards[mockWhiteboardId].cardInstances.length).toBe(0);
  });

  it("handles pressing escape while adding tag", () => {
    renderComponent();

    const addTagBtn = screen.getByTestId("add-tag-btn");
    fireEvent.click(addTagBtn);

    const input = screen.getByPlaceholderText("#tag...");
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

    expect(screen.queryByPlaceholderText("#tag...")).not.toBeInTheDocument();
  });
});
