import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, safeDisableNetwork } from '../firebase';
import { useAuth } from '../components/AuthProvider';

export function useFirebaseSync<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { user } = useAuth();
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isInitialLoad = useRef(true);
  const isLocalUpdate = useRef(false);

  useEffect(() => {
    if (!user) {
      setStoredValue(initialValue);
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'appData', key);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (isLocalUpdate.current) {
        isLocalUpdate.current = false;
        return;
      }

      if (docSnap.exists()) {
        setStoredValue(docSnap.data().value as T);
      } else {
        // Initialize if not exists
        const firebaseValue = initialValue === undefined ? null : JSON.parse(JSON.stringify(initialValue));
        setDoc(docRef, { value: firebaseValue }, { merge: true }).catch((err) => {
          if (err.code === 'resource-exhausted') {
            safeDisableNetwork();
          }
        });
        setStoredValue(initialValue);
      }
      isInitialLoad.current = false;
    }, (error: any) => {
      console.error(`Error syncing ${key} from Firebase:`, error);
      if (error.code === 'resource-exhausted') {
        safeDisableNetwork();
      }
    });

    return () => unsubscribe();
  }, [user, key]);

  const stateRef = useRef<T>(storedValue);
  stateRef.current = storedValue;

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    const newValue = value instanceof Function ? value(stateRef.current) : value;
    
    if (user) {
      isLocalUpdate.current = true;
      const docRef = doc(db, 'users', user.uid, 'appData', key);
      const firebaseValue = newValue === undefined ? null : JSON.parse(JSON.stringify(newValue));
      setDoc(docRef, { value: firebaseValue }, { merge: true }).catch(err => {
        console.error(`Error saving ${key} to Firebase:`, err);
        if (err.code === 'resource-exhausted') {
          safeDisableNetwork();
        }
      });
    }
    
    stateRef.current = newValue;
    setStoredValue(newValue);
  };

  return [storedValue, setValue];
}
