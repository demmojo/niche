import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";

export function useActionCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (controller.signal.aborted) return;

        // Let Firebase latency compensation handle optimistic updates.
        // If it doesn't exist yet, optimistically show 50
        if (!docSnap.exists()) {
          setCredits(50);
        } else if (typeof docSnap.data().actionCredits === "number") {
          setCredits(docSnap.data().actionCredits);
        }
      },
      (err) => {
        if (controller.signal.aborted) return;
        console.error("Snapshot error:", err);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [user?.uid]);

  return credits;
}
