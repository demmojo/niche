import { useState } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { useAuth } from "../components/AuthProvider";

export function usePQLUpgrade() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser, isMergingRef } = useAuth();

  const upgradeAccount = async () => {
    setIsPending(true);
    setError(null);
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
        // If successful, anonUid is now permanent. No backend merge needed!
        // We can just exit here.
        if (isMergingRef) isMergingRef.current = false;
        // Trigger auth state change artificially since we blocked it
        auth.updateCurrentUser(auth.currentUser);
        return true;
      } catch (linkError: any) {
        // Step 2: Handle the credential-already-in-use conflict
        if (linkError.code === "auth/credential-already-in-use") {
          const credential = GoogleAuthProvider.credentialFromError(linkError);
          if (!credential)
            throw new Error("Could not retrieve Google credential.");

          // Sign in as the permanent user (UID changes here)
          const result = await signInWithCredential(auth, credential);
          permToken = await result.user.getIdToken();

          // Step 3: Trigger backend merge because UID changed
          const response = await fetch("/api/auth/merge-anonymous-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${permToken}`,
            },
            body: JSON.stringify({
              anonToken,
              oldUid,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to merge account data.");
          }

          return true;
        } else {
          throw linkError; // Throw unrelated errors
        }
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError(err.message || "Failed to upgrade account.");
      return false;
    } finally {
      if (isMergingRef) {
        isMergingRef.current = false;
      }
      setIsPending(false);
      // Trigger update of user state
      const auth = getAuth();
      if (auth.currentUser) {
        auth.updateCurrentUser(auth.currentUser);
      }
    }
  };

  return { upgradeAccount, isPending, error };
}
