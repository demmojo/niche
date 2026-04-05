import React, {
  createContext,
  use,
  useState,
  useEffect,
  useReducer,
} from "react";
import { useAuth } from "./AuthProvider";

export interface Product {
  id: string;
  name: string;
  niche?: string;
  createdAt?: string;
}

export interface Insight {
  id: string;
  type: "insight" | "feature";
  content: string;
}

export type InsightAction =
  | { type: "ADD_INSIGHT"; insight: Insight }
  | { type: "REMOVE_INSIGHT"; id: string }
  | { type: "SET_INSIGHTS"; insights: Insight[] };

const WorkspaceStateContext = createContext<string | null>(null);
const WorkspaceDispatchContext = createContext<((id: string) => void) | null>(
  null,
);
const WorkspaceLoadingContext = createContext<boolean | null>(null);

const InsightsStateContext = createContext<Insight[] | null>(null);
const InsightsDispatchContext =
  createContext<React.Dispatch<InsightAction> | null>(null);

function insightsReducer(state: Insight[], action: InsightAction): Insight[] {
  switch (action.type) {
    case "ADD_INSIGHT":
      if (state.find((i) => i.id === action.insight.id)) return state;
      return [...state, action.insight];
    case "REMOVE_INSIGHT":
      return state.filter((i) => i.id !== action.id);
    case "SET_INSIGHTS":
      return action.insights;
    default:
      return state;
  }
}

function getWorkspaceId() {
  if (typeof window === "undefined") return "ssr-workspace";
  const urlParams = new URLSearchParams(window.location.search);
  let wid = urlParams.get("w");
  if (wid) {
    try {
      window.localStorage.setItem("nicheai_workspace_id", wid);
    } catch (e) {
      console.warn("localStorage setItem failed", e);
    }
  } else {
    try {
      wid = window.localStorage.getItem("nicheai_workspace_id");
    } catch (e) {
      console.warn("localStorage getItem failed", e);
    }
    if (!wid) {
      wid = `ws-${Math.random().toString(36).substring(2, 9)}`;
      try {
        window.localStorage.setItem("nicheai_workspace_id", wid);
      } catch (e) {
        console.warn("localStorage setItem failed", e);
      }
    }
    urlParams.set("w", wid);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`,
    );
  }
  return wid;
}

export const WORKSPACE_ID = getWorkspaceId();

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceIdState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [insights, dispatchInsights] = useReducer(insightsReducer, []);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    try {
      const storedActiveId = window.localStorage.getItem(
        `${WORKSPACE_ID}_active_product_id_${user.uid}`,
      );
      if (storedActiveId) {
        setWorkspaceIdState(JSON.parse(storedActiveId));
      }
    } catch (e) {
      console.error("Failed to load workspace data from local storage", e);
    }
    setIsLoading(false);
  }, [user?.uid]);

  const setWorkspaceId = (id: string) => {
    setWorkspaceIdState(id);
    if (user?.uid && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          `${WORKSPACE_ID}_active_product_id_${user.uid}`,
          JSON.stringify(id),
        );
      } catch (e) {
        console.warn("localStorage setItem failed", e);
      }
    }
  };

  return (
    <WorkspaceStateContext value={workspaceId}>
      <WorkspaceDispatchContext value={setWorkspaceId}>
        <WorkspaceLoadingContext value={isLoading}>
          <InsightsStateContext value={insights}>
            <InsightsDispatchContext value={dispatchInsights}>
              {children}
            </InsightsDispatchContext>
          </InsightsStateContext>
        </WorkspaceLoadingContext>
      </WorkspaceDispatchContext>
    </WorkspaceStateContext>
  );
}

export function useWorkspace() {
  const context = use(WorkspaceStateContext);
  if (context === null) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

export function useWorkspaceDispatch() {
  const context = use(WorkspaceDispatchContext);
  if (context === null) {
    throw new Error(
      "useWorkspaceDispatch must be used within a WorkspaceProvider",
    );
  }
  return context;
}

export function useWorkspaceLoading() {
  const context = use(WorkspaceLoadingContext);
  if (context === null) {
    throw new Error(
      "useWorkspaceLoading must be used within a WorkspaceProvider",
    );
  }
  return context;
}

export function useInsights() {
  const context = use(InsightsStateContext);
  if (context === null) {
    throw new Error("useInsights must be used within a WorkspaceProvider");
  }
  return context;
}

export function useInsightsDispatch() {
  const context = use(InsightsDispatchContext);
  if (context === null) {
    throw new Error(
      "useInsightsDispatch must be used within a WorkspaceProvider",
    );
  }
  return context;
}
