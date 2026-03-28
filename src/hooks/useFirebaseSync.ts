import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
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
  const isInitialLoad = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      setStoredValue(initialValue);
      return;
    }

    const docRef = doc(db, "users", user.uid, "appData", key);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        // Ignore snapshots triggered by our own local uncommitted writes
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }

        // If a remote update comes in, clear any pending local writes to prevent overwriting it with stale local data
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }

        if (docSnap.exists()) {
          setStoredValue(docSnap.data().value as T);
        } else {
          // Initialize if not exists
          const firebaseValue =
            initialValue === undefined
              ? null
              : JSON.parse(JSON.stringify(initialValue));
          setDoc(docRef, { value: firebaseValue }, { merge: true }).catch(
            (err) => {
              if (err.code === "resource-exhausted") {
                safeDisableNetwork();
              }
            },
          );
          setStoredValue(initialValue);
        }
        isInitialLoad.current = false;
      },
      (error: any) => {
        console.error(`Error syncing ${key} from Firebase:`, error);
        if (error.code === "resource-exhausted") {
          safeDisableNetwork();
        }
      },
    );

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, key]);

  const stateRef = useRef<T>(storedValue);
  stateRef.current = storedValue;

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    const newValue =
      value instanceof Function ? value(stateRef.current) : value;

    if (user) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        const docRef = doc(db, "users", user.uid, "appData", key);
        const firebaseValue =
          newValue === undefined ? null : JSON.parse(JSON.stringify(newValue));
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
