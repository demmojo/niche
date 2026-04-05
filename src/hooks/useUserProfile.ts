import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/AuthProvider";

export type PersonaType = "solo_founder" | "enterprise_pm" | null;

export interface UserProfile {
  persona: PersonaType;
  [key: string]: any;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // E2E Test mock profile hook
    if (
      typeof window !== "undefined" &&
      (window.name === "playwright-test" ||
        window.location.search.includes("mock_auth=true"))
    ) {
      if (window.location.search.includes("e2e_entry=true")) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const mockPersona =
        (window as any).__mock_profile_persona || "solo_founder";
      setProfile({ persona: mockPersona });
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const docRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (controller.signal.aborted) return;
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching user profile:", error);
        setLoading(false);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [user?.uid]);

  return { profile, loading };
}
