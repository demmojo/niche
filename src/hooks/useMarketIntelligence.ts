import { useState, useEffect, useTransition } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

export function useMarketIntelligence<T>(
  collectionName: string,
  queryConstraints: any[] = [],
) {
  const [state, setState] = useState<FetchState<T[]>>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState({ status: "loading" });

    try {
      const q = query(collection(db, collectionName), ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          startTransition(() => {
            setState({ status: "success", data });
          });
        },
        (error) => {
          startTransition(() => {
            setState({ status: "error", error });
          });
        },
      );

      return () => unsubscribe();
    } catch (error: any) {
      setState({ status: "error", error });
    }
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return state;
}
