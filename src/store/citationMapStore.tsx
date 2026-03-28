import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { createContext, useContext, useRef } from "react";

export interface Citation {
  id: string;
  sourceUrl?: string;
  sourceName?: string;
  rawText: string;
  timestamp: number;
}

interface CitationMapState {
  citations: Record<string, Citation>;

  // Actions
  addCitation: (id: string, citation: Omit<Citation, "id">) => void;
  removeCitation: (id: string) => void;
  clearCitations: () => void;
}

export const createCitationMapStore = () =>
  createStore<CitationMapState>((set) => ({
    citations: {},

    addCitation: (id, citation) => {
      set((state) => ({
        citations: {
          ...state.citations,
          [id]: { ...citation, id },
        },
      }));
    },

    removeCitation: (id) => {
      set((state) => {
        const newCitations = { ...state.citations };
        delete newCitations[id];
        return { citations: newCitations };
      });
    },

    clearCitations: () => {
      set({ citations: {} });
    },
  }));

export const testCitationMapStore = createCitationMapStore();

export const CitationMapContext = createContext<ReturnType<
  typeof createCitationMapStore
> | null>(null);

export function CitationMapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<ReturnType<typeof createCitationMapStore>>(null);
  if (!storeRef.current) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    storeRef.current =
      typeof process !== "undefined" && process.env.NODE_ENV === "test"
        ? testCitationMapStore
        : createCitationMapStore();
  }
  return (
    <CitationMapContext.Provider value={storeRef.current}>
      {children}
    </CitationMapContext.Provider>
  );
}

export function useCitationMapStore(): CitationMapState;
export function useCitationMapStore<T>(
  selector: (state: CitationMapState) => T,
): T;
export function useCitationMapStore<T>(
  selector?: (state: CitationMapState) => T,
) {
  const store = useContext(CitationMapContext);
  if (!store) throw new Error("Missing CitationMapProvider");
  return useStore(store, selector!);
}

useCitationMapStore.setState = testCitationMapStore.setState;
useCitationMapStore.getState = testCitationMapStore.getState;
