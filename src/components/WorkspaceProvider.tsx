import React, {
  createContext,
  use,
  useState,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { useAuth } from "./AuthProvider";
import { safeStorageGet, safeStorageSet } from "../utils/storage";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";
import { AuthMergeState } from "../types/auth";
import { getRedirectResult } from "firebase/auth";

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

export const [AuthMergeStateContext, useAuthMergeState] =
  createSafeContext<AuthMergeState>("AuthMergeState");
export const [AuthMergeDispatchContext, useAuthMergeDispatch] =
  createSafeContext<React.Dispatch<React.SetStateAction<AuthMergeState>>>(
    "AuthMergeDispatch",
  );

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
  }
  return wid;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeProductId, setActiveProductIdState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [insights, dispatchInsights] = useReducer(insightsReducer, []);

  // AuthMerge state initialization from sessionStorage
  const [mergeState, setMergeState] = useState<AuthMergeState>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(
        "nicheai_auth_merge_state",
      ) as AuthMergeState;
      return saved || "IDLE";
    }
    return "IDLE";
  });

  // Sync to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nicheai_auth_merge_state", mergeState);
    }
  }, [mergeState]);

  // Handle redirect result automatically on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && mergeState === "AWAITING_OAUTH") {
          // We returned from OAuth redirect!
          // Phase 4 tasks specify executing merge after redirect
          setMergeState("EXECUTING_MERGE");

          const anonUid = sessionStorage.getItem("nicheai_merge_anon_uid");
          const claimTicket = sessionStorage.getItem(
            "nicheai_merge_claim_ticket",
          );

          if (!anonUid || !claimTicket || !auth.currentUser) {
            setMergeState("ERROR");
            return;
          }

          const token = await auth.currentUser.getIdToken(true);
          const endpoint =
            (import.meta.env.VITE_API_BASE_URL || "") +
            "/api/auth/execute-merge";

          const mergeRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ anonUid, claimTicket }),
          });

          if (!mergeRes.ok) {
            throw new Error("Backend merge failed");
          }

          setMergeState("SUCCESS");
          // Clean up
          sessionStorage.removeItem("nicheai_merge_anon_uid");
          sessionStorage.removeItem("nicheai_merge_claim_ticket");
        }
      } catch (err: any) {
        console.error("Redirect check error:", err);
        // Only catch if we were awaiting oauth, meaning we hit credential-in-use during redirect
        if (mergeState === "AWAITING_OAUTH") {
          // We will handle credential conflicts in Phase 4 via linkWithPopup primarily,
          // but redirect fallbacks might need similar conflict logic
          setMergeState("ERROR");
        }
      }
    };
    checkRedirect();
  }, []);

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

    // Sync URL if needed
    const newUrlParams = new URLSearchParams(window.location.search);
    if (newUrlParams.get("w") !== wid) {
      newUrlParams.set("w", wid);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${newUrlParams.toString()}`,
      );
    }

    // Ensure workspace document exists in Firestore
    if (user?.uid && wid && !wid.startsWith("ssr-")) {
      const workspaceRef = doc(db, "workspaces", wid);
      setDoc(
        workspaceRef,
        { members: arrayUnion(user.uid) },
        { merge: true },
      ).catch((e) => {
        // Ignore permission-denied errors (means it exists and we aren't a member, which is fine)
        if (e.code !== "permission-denied") {
          console.error("Failed to initialize workspace:", e);
        }
      });
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
              <AuthMergeStateContext value={mergeState}>
                <AuthMergeDispatchContext value={setMergeState}>
                  {children}
                </AuthMergeDispatchContext>
              </AuthMergeStateContext>
            </InsightsDispatchContext>
          </InsightsStateContext>
        </WorkspaceLoadingContext>
      </WorkspaceDispatchContext>
    </WorkspaceStateContext>
  );
}
