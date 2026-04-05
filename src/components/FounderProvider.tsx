import React, { createContext, use, useState, useEffect } from "react";
import { Product } from "./WorkspaceProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";

const FounderProductsContext = createContext<Product[] | null>(null);
const FounderActiveProductContext = createContext<string | null>(null);
const FounderActiveProductDispatchContext = createContext<
  ((id: string) => void) | null
>(null);

export function FounderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProductId, setActiveProductId] = useState<string>("");

  useEffect(() => {
    if (
      !user ||
      (typeof window !== "undefined" &&
        (window.name === "playwright-test" ||
          window.location.search.includes("mock_auth=true")))
    ) {
      return;
    }

    const controller = new AbortController();
    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("userId", "==", user.uid),
      where("status", "in", ["draft", "deployed_fake_door", "winner"]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (controller.signal.aborted) return;
        const fetchedProducts: Product[] = [];
        snapshot.forEach((doc) => {
          fetchedProducts.push(doc.data() as Product);
        });

        fetchedProducts.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setProducts(fetchedProducts);
      },
      (error) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching founder products:", error);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [user?.uid]);

  return (
    <FounderProductsContext value={products}>
      <FounderActiveProductContext value={activeProductId}>
        <FounderActiveProductDispatchContext value={setActiveProductId}>
          {children}
        </FounderActiveProductDispatchContext>
      </FounderActiveProductContext>
    </FounderProductsContext>
  );
}

export function useFounderProducts() {
  const context = use(FounderProductsContext);
  if (context === null)
    throw new Error("useFounderProducts must be used within FounderProvider");
  return context;
}

export function useFounderActiveProductId() {
  const context = use(FounderActiveProductContext);
  if (context === null)
    throw new Error(
      "useFounderActiveProductId must be used within FounderProvider",
    );
  return context;
}

export function useFounderActiveProductDispatch() {
  const context = use(FounderActiveProductDispatchContext);
  if (context === null)
    throw new Error(
      "useFounderActiveProductDispatch must be used within FounderProvider",
    );
  return context;
}
