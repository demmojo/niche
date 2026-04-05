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

const EMPTY_ARRAY: any[] = [];

export function useMarketIntelligence<T>(
  collectionName: string,
  queryConstraints: any[] = EMPTY_ARRAY,
) {
  const [state, setState] = useState<FetchState<T[]>>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.name === "playwright-test" ||
        window.location.search.includes("mock_auth=true"))
    ) {
      setState({ status: "success", data: [] });
      return;
    }
    setState({ status: "loading" });
    const controller = new AbortController();

    try {
      const q = query(collection(db, collectionName), ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (controller.signal.aborted) return;
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          startTransition(() => {
            setState({ status: "success", data });
          });
        },
        (error) => {
          if (controller.signal.aborted) return;
          startTransition(() => {
            setState({ status: "error", error });
          });
        },
      );

      return () => {
        controller.abort();
        unsubscribe();
      };
    } catch (error: any) {
      if (!controller.signal.aborted) {
        startTransition(() => {
          setState({ status: "error", error });
        });
      }
    }
  }, [collectionName, queryConstraints]);

  return state;
}
