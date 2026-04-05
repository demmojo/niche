import React, { createContext, use, useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";

export interface Watchlist {
  id: string;
  name: string;
  createdAt?: string;
}

const EnterpriseWatchlistsContext = createContext<Watchlist[] | null>(null);
const EnterpriseActiveWatchlistContext = createContext<string | null>(null);
const EnterpriseActiveWatchlistDispatchContext = createContext<
  ((id: string) => void) | null
>(null);

export function EnterpriseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>("");

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
    const watchlistsRef = collection(db, "watchlists");
    const q = query(watchlistsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (controller.signal.aborted) return;
        const fetchedWatchlists: Watchlist[] = [];
        snapshot.forEach((doc) => {
          fetchedWatchlists.push(doc.data() as Watchlist);
        });

        fetchedWatchlists.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setWatchlists(fetchedWatchlists);
      },
      (error) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching enterprise watchlists:", error);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [user?.uid]);

  return (
    <EnterpriseWatchlistsContext value={watchlists}>
      <EnterpriseActiveWatchlistContext value={activeWatchlistId}>
        <EnterpriseActiveWatchlistDispatchContext value={setActiveWatchlistId}>
          {children}
        </EnterpriseActiveWatchlistDispatchContext>
      </EnterpriseActiveWatchlistContext>
    </EnterpriseWatchlistsContext>
  );
}

export function useEnterpriseWatchlists() {
  const context = use(EnterpriseWatchlistsContext);
  if (context === null)
    throw new Error(
      "useEnterpriseWatchlists must be used within EnterpriseProvider",
    );
  return context;
}

export function useEnterpriseActiveWatchlistId() {
  const context = use(EnterpriseActiveWatchlistContext);
  if (context === null)
    throw new Error(
      "useEnterpriseActiveWatchlistId must be used within EnterpriseProvider",
    );
  return context;
}

export function useEnterpriseActiveWatchlistDispatch() {
  const context = use(EnterpriseActiveWatchlistDispatchContext);
  if (context === null)
    throw new Error(
      "useEnterpriseActiveWatchlistDispatch must be used within EnterpriseProvider",
    );
  return context;
}
