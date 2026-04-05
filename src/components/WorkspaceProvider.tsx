import React, {
  createContext,
  use,
  useState,
  useEffect,
  useReducer,
  useCallback,
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

function createSafeContext<T>(name: string) {
  const Context = createContext<T | null>(null);
  function useSafeContext() {
    const context = use(Context);
    if (context === null) {
      throw new Error(`use${name} must be used within a WorkspaceProvider`);
    }
    return context;
  }
  return [Context, useSafeContext] as const;
}

export const [WorkspaceStateContext, useWorkspace] =
  createSafeContext<string>("Workspace");
export const [WorkspaceDispatchContext, useWorkspaceDispatch] =
  createSafeContext<(id: string) => void>("WorkspaceDispatch");
export const [WorkspaceLoadingContext, useWorkspaceLoading] =
  createSafeContext<boolean>("WorkspaceLoading");
export const [InsightsStateContext, useInsights] =
  createSafeContext<Insight[]>("Insights");
export const [InsightsDispatchContext, useInsightsDispatch] =
  createSafeContext<React.Dispatch<InsightAction>>("InsightsDispatch");

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

function safeStorageSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage setItem failed for key: ${key}`, e);
  }
}

function safeStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn(`localStorage getItem failed for key: ${key}`, e);
    return null;
  }
}

export function initializeWorkspaceId(syncUrl: boolean = true) {
  if (typeof window === "undefined") return "ssr-workspace";
  const urlParams = new URLSearchParams(window.location.search);
  let wid = urlParams.get("w");
  if (wid) {
    safeStorageSet("nicheai_workspace_id", wid);
  } else {
    wid = safeStorageGet("nicheai_workspace_id");
    if (!wid) {
      wid = `ws-${Math.random().toString(36).substring(2, 9)}`;
      safeStorageSet("nicheai_workspace_id", wid);
    }
    if (syncUrl) {
      urlParams.set("w", wid);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${urlParams.toString()}`,
      );
    }
  }
  return wid;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeProductId, setActiveProductIdState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [insights, dispatchInsights] = useReducer(insightsReducer, []);

  useEffect(() => {
    // Only fetch on client-side and after auth loads
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    // Now initializeWorkspaceId is executed only in the browser context, preventing SSR module-side-effects
    const wid = initializeWorkspaceId(true);
    const storedActiveId = safeStorageGet(`${wid}_active_product_id`);

    if (storedActiveId) {
      setActiveProductIdState(storedActiveId);
    }
    setIsLoading(false);
  }, [user?.uid]);

  const setWorkspaceId = useCallback(
    (id: string) => {
      setActiveProductIdState(id);
      if (user?.uid) {
        const wid = initializeWorkspaceId(false);
        safeStorageSet(`${wid}_active_product_id`, id);
      }
    },
    [user?.uid],
  );

  return (
    <WorkspaceStateContext value={activeProductId}>
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
