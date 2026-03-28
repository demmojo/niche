import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setLogLevel, disableNetwork } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Suppress internal Firestore logs, especially for quota exceeded errors
setLogLevel('silent');

export const auth = getAuth(app);

let isNetworkDisabled = false;
let disableNetworkPromise: Promise<void> | null = null;

export const safeDisableNetwork = async () => {
  if (isNetworkDisabled) return;
  if (disableNetworkPromise) return disableNetworkPromise;
  
  try {
    disableNetworkPromise = disableNetwork(db);
    await disableNetworkPromise;
    isNetworkDisabled = true;
    console.warn("Firestore network disabled due to quota limits. Falling back to local storage.");
  } catch (error) {
    console.error("Failed to disable Firestore network:", error);
  } finally {
    disableNetworkPromise = null;
  }
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (createError) {
        throw createError;
      }
    } else {
      throw error;
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
