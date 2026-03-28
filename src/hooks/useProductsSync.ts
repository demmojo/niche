import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";
import { Product } from "../types/product";

export function useProductsSync() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Only get active variants (not superseded, not archived)
    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("userId", "==", user.uid),
      where("status", "in", ["draft", "deployed_fake_door", "winner"]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  return { products, loading };
}
