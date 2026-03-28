import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";

export function useActionCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    // Fallback if document doesn't exist yet, we'll optimistically show 50
    // Backend creates it on first sync if it's completely empty.
    getDoc(userRef).then((snap) => {
      if (!snap.exists()) {
        setCredits(50);
      }
    });

    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists() && typeof doc.data().actionCredits === "number") {
        setCredits(doc.data().actionCredits);
      }
    });

    return () => unsubscribe();
  }, [user]);

  return credits;
}
