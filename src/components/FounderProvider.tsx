import React, { createContext, use, useState, useEffect } from "react";
import { Product } from "./WorkspaceProvider";
import { useWorkspace } from "./WorkspaceProvider";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";

const FounderProductsContext = createContext<{
  products: Product[];
  isInitialized: boolean;
} | null>(null);
const FounderActiveProductContext = createContext<string | null>(null);
const FounderActiveProductDispatchContext = createContext<
  ((id: string) => void) | null
>(null);

export function FounderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsInitialized, setIsProductsInitialized] =
    useState<boolean>(false);
  const [activeProductId, setActiveProductId] = useState<string>("");

  useEffect(() => {
    if (
      !user ||
      (typeof window !== "undefined" &&
        (window.name === "playwright-test" ||
          window.location.search.includes("mock_auth=true")))
    ) {
      setIsProductsInitialized(true);
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
      async (snapshot) => {
        if (controller.signal.aborted) return;
        let fetchedProducts: Product[] = [];
        snapshot.forEach((d) => {
          fetchedProducts.push({ id: d.id, ...d.data() } as Product);
        });

        // Legacy Data Migration
        if (fetchedProducts.length === 0 && workspace) {
          try {
            if (workspace) {
              const legacyDocRef = doc(
                db,
                "workspaces",
                workspace,
                "appData",
                "my_product_data_",
              );
              const legacyDoc = await getDoc(legacyDocRef);

              if (legacyDoc.exists() && legacyDoc.data().value?.name) {
                const legacyData = legacyDoc.data().value;
                const batch = writeBatch(db);

                const newProductRef = doc(collection(db, "products"));
                batch.set(newProductRef, {
                  userId: user.uid,
                  name: legacyData.name || "My Legacy Product",
                  status: "draft",
                  createdAt: serverTimestamp(),
                });

                const newProductDataRef = doc(
                  db,
                  "workspaces",
                  workspace,
                  "appData",
                  `my_product_data_${newProductRef.id}`,
                );
                batch.set(
                  newProductDataRef,
                  { value: legacyData },
                  { merge: true },
                );

                batch.set(legacyDocRef, { value: null }, { merge: true });

                await batch.commit();

                return; // Do not set isInitialized yet, wait for the next snapshot
              }
            }
          } catch (err) {
            console.error("Migration failed", err);
          }
        }

        fetchedProducts.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setProducts(fetchedProducts);
        setIsProductsInitialized(true);
      },
      (error) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching founder products:", error);
        setIsProductsInitialized(true);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [user?.uid]);

  return (
    <FounderProductsContext
      value={{ products, isInitialized: isProductsInitialized }}
    >
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
