import { describe, it, expect, beforeEach } from "vitest";
import { useVisualKnowledgeStore } from "../../store/visualKnowledgeStore";

describe("visualKnowledgeStore", () => {
  beforeEach(() => {
    // Reset state before each test
    useVisualKnowledgeStore.setState({
      cards: {},
      whiteboards: {},
      activeWhiteboardId: null,
    });
  });

  it("adds and updates a card", () => {
    const store = useVisualKnowledgeStore.getState();
    const cardId = store.addCard({
      title: "Test Card",
      content: "Test content",
      type: "note",
      tags: ["#test"],
    });

    let state = useVisualKnowledgeStore.getState();
    expect(state.cards[cardId]).toBeDefined();
    expect(state.cards[cardId].title).toBe("Test Card");

    // Update
    state.updateCard(cardId, { title: "Updated Card" });
    state = useVisualKnowledgeStore.getState();
    expect(state.cards[cardId].title).toBe("Updated Card");
  });

  it("creates and manages whiteboards", () => {
    const store = useVisualKnowledgeStore.getState();
    const wbId = store.createWhiteboard("My Board");

    let state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId]).toBeDefined();
    expect(state.activeWhiteboardId).toBe(wbId);
    expect(state.whiteboards[wbId].name).toBe("My Board");

    // Update
    state.updateWhiteboard(wbId, { name: "Updated Board" });
    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].name).toBe("Updated Board");

    // Set active
    const wbId2 = store.createWhiteboard("Second Board");
    state = useVisualKnowledgeStore.getState();
    expect(state.activeWhiteboardId).toBe(wbId2);

    state.setActiveWhiteboard(wbId);
    state = useVisualKnowledgeStore.getState();
    expect(state.activeWhiteboardId).toBe(wbId);
  });

  it("places a card on a whiteboard and removes it", () => {
    const store = useVisualKnowledgeStore.getState();
    const cardId = store.addCard({
      title: "Card 1",
      content: "Content 1",
      type: "insight",
      tags: [],
    });
    const wbId = store.createWhiteboard("Board 1");

    let state = useVisualKnowledgeStore.getState();
    state.placeCardOnWhiteboard(wbId, cardId, { x: 10, y: 20 });

    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].cardInstances.length).toBe(1);

    const instanceId = state.whiteboards[wbId].cardInstances[0].id;
    expect(state.whiteboards[wbId].cardInstances[0].position).toEqual({
      x: 10,
      y: 20,
    });

    // Update instance position
    state.updateCardInstancePosition(wbId, instanceId, { x: 30, y: 40 });
    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].cardInstances[0].position).toEqual({
      x: 30,
      y: 40,
    });

    // Remove instance
    state.removeCardFromWhiteboard(wbId, instanceId);
    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].cardInstances.length).toBe(0);
  });

  it("adds and removes edges", () => {
    const store = useVisualKnowledgeStore.getState();
    const wbId = store.createWhiteboard("Board 1");

    let state = useVisualKnowledgeStore.getState();
    state.addEdge(wbId, { source: "inst-1", target: "inst-2" });

    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].edges.length).toBe(1);

    const edgeId = state.whiteboards[wbId].edges[0].id;
    expect(state.whiteboards[wbId].edges[0].source).toBe("inst-1");
    expect(state.whiteboards[wbId].edges[0].target).toBe("inst-2");

    state.removeEdge(wbId, edgeId);
    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].edges.length).toBe(0);
  });

  it("deleting a global card removes its instances and connected edges from all whiteboards", () => {
    const store = useVisualKnowledgeStore.getState();
    const cardId = store.addCard({
      title: "Card 1",
      content: "Content 1",
      type: "insight",
      tags: [],
    });
    const wbId = store.createWhiteboard("Board 1");

    let state = useVisualKnowledgeStore.getState();
    state.placeCardOnWhiteboard(wbId, cardId, { x: 0, y: 0 });
    state = useVisualKnowledgeStore.getState();
    const instanceId = state.whiteboards[wbId].cardInstances[0].id;

    state.addEdge(wbId, { source: instanceId, target: "other-inst" });
    state = useVisualKnowledgeStore.getState();
    expect(state.whiteboards[wbId].cardInstances.length).toBe(1);
    expect(state.whiteboards[wbId].edges.length).toBe(1);

    // Delete the card globally
    state.deleteCard(cardId);

    state = useVisualKnowledgeStore.getState();
    // Card should be gone
    expect(state.cards[cardId]).toBeUndefined();
    // Instance should be removed from whiteboard
    expect(state.whiteboards[wbId].cardInstances.length).toBe(0);
    // Edge connected to instance should be removed
    expect(state.whiteboards[wbId].edges.length).toBe(0);
  });

  it("handles edge cases gracefully", () => {
    const store = useVisualKnowledgeStore.getState();
    // Invalid whiteboard operations shouldn't crash
    store.placeCardOnWhiteboard("invalid-wb", "card-1", { x: 0, y: 0 });
    store.removeCardFromWhiteboard("invalid-wb", "inst-1");
    store.updateCardInstancePosition("invalid-wb", "inst-1", { x: 0, y: 0 });
    store.addEdge("invalid-wb", { source: "1", target: "2" });
    store.removeEdge("invalid-wb", "edge-1");

    const state = useVisualKnowledgeStore.getState();
    expect(Object.keys(state.whiteboards).length).toBe(0);
  });
});
