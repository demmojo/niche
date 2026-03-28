import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { createContext, useContext, useRef } from "react";

// Decoupled Card (exists globally, independent of whiteboards)
export interface Card {
  id: string;
  title: string;
  content: string;
  type: "competitor" | "insight" | "note" | "category" | "root";
  tags: string[];
  // If the card is bound to a specific external entity (e.g. Apollo competitor ID)
  entityId?: string;
  linkedCards?: string[]; // semantic conceptual links
}

export interface WhiteboardEdge {
  id: string;
  source: string; // cardInstanceId
  target: string; // cardInstanceId
  type?: "default" | "step" | "smoothstep" | "straight";
}

// An instance of a card placed on a specific whiteboard
export interface CardInstance {
  id: string; // Unique instance ID (to allow the same card multiple times, or just 1:1)
  cardId: string; // References the global Card
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

export interface Whiteboard {
  id: string;
  name: string;
  cardInstances: CardInstance[];
  edges: WhiteboardEdge[];
}

interface VisualKnowledgeState {
  cards: Record<string, Card>;
  whiteboards: Record<string, Whiteboard>;
  activeWhiteboardId: string | null;

  // Actions
  addCard: (card: Omit<Card, "id">) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;

  createWhiteboard: (name: string, templateId?: string) => string;
  setActiveWhiteboard: (id: string) => void;
  updateWhiteboard: (id: string, updates: Partial<Whiteboard>) => void;

  placeCardOnWhiteboard: (
    whiteboardId: string,
    cardId: string,
    position: { x: number; y: number },
  ) => void;
  removeCardFromWhiteboard: (whiteboardId: string, instanceId: string) => void;
  updateCardInstancePosition: (
    whiteboardId: string,
    instanceId: string,
    position: { x: number; y: number },
  ) => void;

  addEdge: (whiteboardId: string, edge: Omit<WhiteboardEdge, "id">) => void;
  removeEdge: (whiteboardId: string, edgeId: string) => void;

  setInitialData: (data: Partial<VisualKnowledgeState>) => void;
}

export const createVisualKnowledgeStore = () =>
  createStore<VisualKnowledgeState>((set, get) => ({
    cards: {},
    whiteboards: {},
    activeWhiteboardId: null,

    addCard: (cardData) => {
      const id = `card-${Date.now()}`;
      set((state) => ({
        cards: {
          ...state.cards,
          [id]: { ...cardData, id },
        },
      }));
      return id;
    },

    updateCard: (id, updates) => {
      set((state) => ({
        cards: {
          ...state.cards,
          [id]: { ...state.cards[id], ...updates },
        },
      }));
    },

    deleteCard: (id) => {
      set((state) => {
        const newCards = { ...state.cards };
        delete newCards[id];

        const newWhiteboards: Record<string, Whiteboard> = {};

        Object.keys(state.whiteboards).forEach((wbId) => {
          const wb = state.whiteboards[wbId];

          // Find instances that are being removed to also remove their edges
          const removedInstanceIds = wb.cardInstances
            .filter((inst) => inst.cardId === id)
            .map((inst) => inst.id);

          newWhiteboards[wbId] = {
            ...wb,
            cardInstances: wb.cardInstances.filter(
              (inst) => inst.cardId !== id,
            ),
            edges: wb.edges.filter(
              (edge) =>
                !removedInstanceIds.includes(edge.source) &&
                !removedInstanceIds.includes(edge.target),
            ),
          };
        });

        return {
          cards: newCards,
          whiteboards: newWhiteboards,
        };
      });
    },

    createWhiteboard: (name) => {
      const id = `wb-${Date.now()}`;
      set((state) => ({
        whiteboards: {
          ...state.whiteboards,
          [id]: {
            id,
            name,
            cardInstances: [],
            edges: [],
          },
        },
        activeWhiteboardId: id,
      }));
      return id;
    },

    setActiveWhiteboard: (id) => {
      set({ activeWhiteboardId: id });
    },

    updateWhiteboard: (id, updates) => {
      set((state) => ({
        whiteboards: {
          ...state.whiteboards,
          [id]: { ...state.whiteboards[id], ...updates },
        },
      }));
    },

    placeCardOnWhiteboard: (whiteboardId, cardId, position) => {
      const instanceId = `inst-${Date.now()}`;
      set((state) => {
        const wb = state.whiteboards[whiteboardId];
        if (!wb) return state;

        return {
          whiteboards: {
            ...state.whiteboards,
            [whiteboardId]: {
              ...wb,
              cardInstances: [
                ...wb.cardInstances,
                { id: instanceId, cardId, position },
              ],
            },
          },
        };
      });
    },

    removeCardFromWhiteboard: (whiteboardId, instanceId) => {
      set((state) => {
        const wb = state.whiteboards[whiteboardId];
        if (!wb) return state;

        return {
          whiteboards: {
            ...state.whiteboards,
            [whiteboardId]: {
              ...wb,
              cardInstances: wb.cardInstances.filter(
                (inst) => inst.id !== instanceId,
              ),
              edges: wb.edges.filter(
                (edge) =>
                  edge.source !== instanceId && edge.target !== instanceId,
              ),
            },
          },
        };
      });
    },

    updateCardInstancePosition: (whiteboardId, instanceId, position) => {
      set((state) => {
        const wb = state.whiteboards[whiteboardId];
        if (!wb) return state;

        return {
          whiteboards: {
            ...state.whiteboards,
            [whiteboardId]: {
              ...wb,
              cardInstances: wb.cardInstances.map((inst) =>
                inst.id === instanceId ? { ...inst, position } : inst,
              ),
            },
          },
        };
      });
    },

    addEdge: (whiteboardId, edgeData) => {
      const id = `edge-${Date.now()}`;
      set((state) => {
        const wb = state.whiteboards[whiteboardId];
        if (!wb) return state;

        return {
          whiteboards: {
            ...state.whiteboards,
            [whiteboardId]: {
              ...wb,
              edges: [...wb.edges, { ...edgeData, id }],
            },
          },
        };
      });
    },

    removeEdge: (whiteboardId, edgeId) => {
      set((state) => {
        const wb = state.whiteboards[whiteboardId];
        if (!wb) return state;

        return {
          whiteboards: {
            ...state.whiteboards,
            [whiteboardId]: {
              ...wb,
              edges: wb.edges.filter((edge) => edge.id !== edgeId),
            },
          },
        };
      });
    },

    setInitialData: (data) => {
      set(data);
    },
  }));

export const testVisualKnowledgeStore = createVisualKnowledgeStore();

export const VisualKnowledgeContext = createContext<ReturnType<
  typeof createVisualKnowledgeStore
> | null>(null);

export function VisualKnowledgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<ReturnType<typeof createVisualKnowledgeStore>>(null);
  if (!storeRef.current) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    storeRef.current =
      typeof process !== "undefined" && process.env.NODE_ENV === "test"
        ? testVisualKnowledgeStore
        : createVisualKnowledgeStore();
  }
  return (
    <VisualKnowledgeContext.Provider value={storeRef.current}>
      {children}
    </VisualKnowledgeContext.Provider>
  );
}

export function useVisualKnowledgeStore(): VisualKnowledgeState;
export function useVisualKnowledgeStore<T>(
  selector: (state: VisualKnowledgeState) => T,
): T;
export function useVisualKnowledgeStore<T>(
  selector?: (state: VisualKnowledgeState) => T,
) {
  const store = useContext(VisualKnowledgeContext);
  if (!store) throw new Error("Missing VisualKnowledgeProvider");
  return useStore(store, selector!);
}

// Attach methods for test compatibility
useVisualKnowledgeStore.setState = testVisualKnowledgeStore.setState;
useVisualKnowledgeStore.getState = testVisualKnowledgeStore.getState;
