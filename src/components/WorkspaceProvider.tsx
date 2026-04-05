import React, { createContext, use, useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

export interface Product {
  id: string;
  name: string;
  niche?: string;
  createdAt?: string;
}

const WorkspaceStateContext = createContext<string | null>(null);
const WorkspaceDispatchContext = createContext<((id: string) => void) | null>(
  null,
);
const WorkspaceLoadingContext = createContext<boolean | null>(null);

function getWorkspaceId() {
  const urlParams = new URLSearchParams(window.location.search);
  let wid = urlParams.get("w");
  if (wid) {
    try {
      window.localStorage.setItem("nicheai_workspace_id", wid);
    } catch (e) {}
  } else {
    try {
      wid = window.localStorage.getItem("nicheai_workspace_id");
    } catch (e) {}
    if (!wid) {
      wid = `ws-${Math.random().toString(36).substring(2, 9)}`;
      try {
        window.localStorage.setItem("nicheai_workspace_id", wid);
      } catch (e) {}
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
    if (user?.uid) {
      try {
        window.localStorage.setItem(
          `${WORKSPACE_ID}_active_product_id_${user.uid}`,
          JSON.stringify(id),
        );
      } catch (e) {}
    }
  };

  return (
    <WorkspaceStateContext value={workspaceId}>
      <WorkspaceDispatchContext value={setWorkspaceId}>
        <WorkspaceLoadingContext value={isLoading}>
          {children}
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
