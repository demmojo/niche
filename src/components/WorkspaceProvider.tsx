import React, { createContext, use, useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

export interface Product {
  id: string;
  name: string;
  niche?: string;
}

const WorkspaceStateContext = createContext<string | null>(null);
const WorkspaceDispatchContext = createContext<((id: string) => void) | null>(
  null,
);
const ProductsStateContext = createContext<Product[] | null>(null);
const ProductsDispatchContext = createContext<
  ((products: Product[]) => void) | null
>(null);
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

const WORKSPACE_ID = getWorkspaceId();

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [workspaceId, setWorkspaceIdState] = useState<string>("");
  const [products, setProductsState] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from local storage on mount/user change
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    try {
      const storedProducts = window.localStorage.getItem(
        `${WORKSPACE_ID}_user_products_${user.uid}`,
      );
      if (storedProducts) {
        setProductsState(JSON.parse(storedProducts));
      }

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

  const setProducts = (newProducts: Product[]) => {
    setProductsState(newProducts);
    if (user?.uid) {
      try {
        window.localStorage.setItem(
          `${WORKSPACE_ID}_user_products_${user.uid}`,
          JSON.stringify(newProducts),
        );
      } catch (e) {}
    }
  };

  return (
    <WorkspaceStateContext value={workspaceId}>
      <WorkspaceDispatchContext value={setWorkspaceId}>
        <ProductsStateContext value={products}>
          <ProductsDispatchContext value={setProducts}>
            <WorkspaceLoadingContext value={isLoading}>
              {children}
            </WorkspaceLoadingContext>
          </ProductsDispatchContext>
        </ProductsStateContext>
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

export function useProducts() {
  const context = use(ProductsStateContext);
  if (context === null) {
    throw new Error("useProducts must be used within a WorkspaceProvider");
  }
  return context;
}

export function useProductsDispatch() {
  const context = use(ProductsDispatchContext);
  if (context === null) {
    throw new Error(
      "useProductsDispatch must be used within a WorkspaceProvider",
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
