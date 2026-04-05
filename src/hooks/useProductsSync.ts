import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";
import { Product } from "../types/product";

export function useProductsSync() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"STATE_LOADING" | "STATE_IDLE">(
    "STATE_LOADING",
  );

  useEffect(() => {
    if (
      !user ||
      (typeof window !== "undefined" &&
        (window.name === "playwright-test" ||
          window.location.search.includes("mock_auth=true")))
    ) {
      setProducts([]);
      setStatus("STATE_IDLE");
      return;
    }

    const controller = new AbortController();

    // Only get active variants (not superseded, not archived)
    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("userId", "==", user.uid),
      where("status", "in", ["draft", "deployed_fake_door", "winner"]),
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (controller.signal.aborted) return;

        const fetchedProducts: Product[] = [];
        snapshot.forEach((doc) => {
          fetchedProducts.push(doc.data() as Product);
        });

        // Sort by createdAt desc
        fetchedProducts.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setProducts(fetchedProducts);
        setStatus("STATE_IDLE");
      },
      (error) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching products:", error);
        setStatus("STATE_IDLE");
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [user?.uid]);

  return { products, status, loading: status === "STATE_LOADING" }; // Keep loading for backward compatibility if needed, but expose status
}
