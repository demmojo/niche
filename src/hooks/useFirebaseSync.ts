import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db, safeDisableNetwork } from "../firebase";
import { useAuth } from "../components/AuthProvider";

/**
 * Synchronizes local component state with a specific Firebase Firestore document.
 *
 * @description
 * Returns a stateful value and a function to update it, exactly like `useState`.
 * The local state is updated immediately (optimistic UI), while the heavy JSON
 * serialization and network request are deferred to a 2000ms debounced timeout.
 *
 * This hook automatically disables the network via `safeDisableNetwork()` if the
 * Firebase "resource-exhausted" quota is reached to prevent repeated failures.
 *
 * @param key - The unique string key for the data (used as the document ID in Firestore).
 * @param initialValue - The initial state value if the document does not exist.
 * @returns A tuple: `[currentState, setterFunction]`
 *
 * @throws Does not throw directly to the UI, but catches and logs Firestore errors.
 * If the quota is exceeded, the network is disabled automatically.
 *
 * @example
 * ```tsx
 * const [notes, setNotes] = useFirebaseSync<string[]>('userNotes', []);
 *
 * // Updates UI instantly, syncs to Firebase after 2s of inactivity
 * setNotes([...notes, 'New Note']);
 * ```
 */
export function useFirebaseSync<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { user } = useAuth();
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentValueRef = useRef<T | null>(null);
  const stateRef = useRef<T>(storedValue);

  useEffect(() => {
    if (
      !user ||
      (typeof window !== "undefined" &&
        window.location.search.includes("mock_auth=true"))
    ) {
      setStoredValue(initialValue);
      return;
    }

    const controller = new AbortController();
    const docRef = doc(db, "users", user.uid, "appData", key);

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (controller.signal.aborted) return;

        // Ignore snapshots triggered by our own local uncommitted writes
        // because we're debouncing and managing local state independently
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }

        // If a remote update comes in, clear any pending local writes to prevent overwriting it with stale local data
        const incomingData = docSnap.exists()
          ? docSnap.data().value
          : initialValue;

        // Check if this snapshot is an echo of what we recently sent to the server
        const isEchoOfLastSent =
          lastSentValueRef.current !== null &&
          JSON.stringify(incomingData) ===
            JSON.stringify(lastSentValueRef.current);

        // If it's a stale echo, but we have new local writes pending (syncTimeoutRef is active)
        // or new state we've already set, we should IGNORE this echo to prevent "Snapshot Beats the Fetch" tearing.
        if (
          isEchoOfLastSent &&
          (syncTimeoutRef.current !== null ||
            JSON.stringify(incomingData) !== JSON.stringify(stateRef.current))
        ) {
          return;
        }

        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }

        setStoredValue(incomingData as T);
      },
      (error: any) => {
        if (controller.signal.aborted) return;
        console.error(`Error syncing ${key} from Firebase:`, error);
        if (error.code === "resource-exhausted") {
          safeDisableNetwork();
        }
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;

        // FLUSH pending write on unmount to prevent data loss!
        if (
          typeof window !== "undefined" &&
          window.location.search.includes("mock_auth=true")
        ) {
          return;
        }
        const docRef = doc(db, "users", user.uid, "appData", key);
        const firebaseValue =
          stateRef.current === undefined
            ? null
            : JSON.parse(JSON.stringify(stateRef.current));
        setDoc(docRef, { value: firebaseValue }, { merge: true }).catch(
          (err) => {
            console.error(`Error flushing ${key} to Firebase on unmount:`, err);
          },
        );
      }
    };
  }, [user?.uid, key]);

  stateRef.current = storedValue;

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    const newValue =
      value instanceof Function ? value(stateRef.current) : value;

    if (user) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        // Clear the ref when the timeout executes, so we know there's no active typing buffer
        syncTimeoutRef.current = null;

        if (
          typeof window !== "undefined" &&
          window.location.search.includes("mock_auth=true")
        ) {
          return;
        }
        const docRef = doc(db, "users", user.uid, "appData", key);
        const firebaseValue =
          newValue === undefined ? null : JSON.parse(JSON.stringify(newValue));

        // Track what we just sent to distinguish echoes from genuine remote updates
        lastSentValueRef.current = firebaseValue;

        setDoc(docRef, { value: firebaseValue }, { merge: true }).catch(
          (err) => {
            console.error(`Error saving ${key} to Firebase:`, err);
            if (err.code === "resource-exhausted") {
              safeDisableNetwork();
            }
          },
        );
      }, 2000);
    }

    stateRef.current = newValue;
    setStoredValue(newValue);
  };

  return [storedValue, setValue];
}
