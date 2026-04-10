import { useState, useRef, useEffect } from "react";
import {
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { useAuth } from "../components/AuthProvider";

export type UpgradeState = "STATE_IDLE" | "STATE_MERGING" | "STATE_ERRORED";

export function usePQLUpgrade() {
  const [upgradeState, setUpgradeState] = useState<UpgradeState>("STATE_IDLE");
  const [error, setError] = useState<string | null>(null);
  const { user: authUser, isMergingRef } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const upgradeAccount = async () => {
    if (upgradeState === "STATE_MERGING") return false;

    setUpgradeState("STATE_MERGING");
    setError(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      if (isMergingRef) {
        isMergingRef.current = true;
      }

      const auth = getAuth();
      const anonUser = auth.currentUser;

      if (!anonUser || !anonUser.isAnonymous) {
        throw new Error("You are already logged in or not anonymous.");
      }

      const anonToken = await anonUser.getIdToken();
      const oldUid = anonUser.uid;
      const provider = new GoogleAuthProvider();

      let permToken: string;

      try {
        // Step 1: Try to link the account in-place
        await linkWithPopup(anonUser, provider);

        if (signal.aborted) return false;

        // If successful, anonUid is now permanent. No backend merge needed!
        if (isMergingRef) isMergingRef.current = false;
        // Trigger auth state change artificially since we blocked it
        auth.updateCurrentUser(auth.currentUser);
        setUpgradeState("STATE_IDLE");
        return true;
      } catch (linkError: any) {
        if (signal.aborted) return false;

        // Step 2: Handle the credential-already-in-use conflict
        if (linkError.code === "auth/credential-already-in-use") {
          const credential = GoogleAuthProvider.credentialFromError(linkError);
          if (!credential)
            throw new Error("Could not retrieve Google credential.");

          // Sign in as the permanent user (UID changes here)
          const result = await signInWithCredential(auth, credential);

          if (signal.aborted) return false;

          permToken = await result.user.getIdToken();

          // Step 3: Trigger backend merge because UID changed
          const response = await fetch(
            (import.meta.env.VITE_API_BASE_URL || "") +
              "/api/auth/merge-anonymous-data",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${permToken}`,
              },
              body: JSON.stringify({
                anonToken,
                oldUid,
              }),
              signal,
            },
          );

          if (!response.ok) {
            throw new Error("Failed to merge account data.");
          }

          setUpgradeState("STATE_IDLE");
          return true;
        } else {
          throw linkError; // Throw unrelated errors
        }
      }
    } catch (err: any) {
      if (signal.aborted) return false;

      console.error("Upgrade error:", err);
      setError(err.message || "Failed to upgrade account.");
      setUpgradeState("STATE_ERRORED");
      return false;
    } finally {
      if (isMergingRef) {
        isMergingRef.current = false;
      }
      // Always trigger update of global user state, even if this specific
      // component unmounted during the merge, to ensure AuthProvider is synced.
      const auth = getAuth();
      if (auth.currentUser) {
        auth.updateCurrentUser(auth.currentUser);
      }
    }
  };

  return {
    upgradeAccount,
    upgradeState,
    isPending: upgradeState === "STATE_MERGING",
    error,
  };
}
