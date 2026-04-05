import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, loginWithGoogle, loginWithEmail, logout } from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isMergingRef: React.MutableRefObject<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/**
 *
 */
export const useAuth = () => useContext(AuthContext);

/**
 *
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMergingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: if auth takes longer than 5 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      console.warn(
        "Auth state took too long to resolve. Forcing load completion.",
      );
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed! User:", user?.uid || "null");
      clearTimeout(safetyTimeout);

      if (isMergingRef.current) {
        console.log("Auth state change ignored due to isMergingRef lock.");
        return;
      }

      if (!user) {
        if (
          typeof window !== "undefined" &&
          window.location.search.includes("mock_auth=true")
        ) {
          console.log("mock_auth=true detected, bypassing anonymous sign-in.");
          if (isMounted) {
            const isUserRole = window.location.search.includes("role=user");
            const mockEmail = isUserRole
              ? "user@example.com"
              : "mo.hassaniv@gmail.com";
            setUser({
              uid: "test-user-123",
              email: mockEmail,
              isAnonymous: false,
            } as any);
            setLoading(false);
          }
          return;
        }

        try {
          console.log("Attempting to sign in anonymously...");
          // Ensure we don't block the UI forever on this
          await signInAnonymously(auth);
          console.log("Signed in anonymously!");
        } catch (error) {
          console.error("Failed to sign in anonymously:", error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        } finally {
          // Whether anonymous auth succeeds or fails, we should stop loading
          // so the UI can be interactive instead of getting stuck on a blank screen.
          if (isMounted) {
            setLoading(false);
          }
        }
        return;
      }

      if (user && !user.isAnonymous) {
        // Implement polling loop for Firebase JWT custom claims
        // to prevent race condition on new user signup before Supabase calls
        let claimsFound = false;
        let attempts = 0;
        const maxAttempts = 10; // 5 seconds max (500ms * 10)

        while (!claimsFound && attempts < maxAttempts) {
          try {
            // Force refresh the token to get the latest custom claims
            const tokenResult = await user.getIdTokenResult(true);
            const claims = tokenResult.claims;

            if (claims.team_id && claims.role === "authenticated") {
              console.log("Supabase custom claims found on JWT.");
              claimsFound = true;
            } else {
              console.log(
                `Waiting for custom claims... attempt ${attempts + 1}/${maxAttempts}`,
              );
              // Check if component unmounted while waiting
              if (!isMounted) return;
              await new Promise((resolve) => setTimeout(resolve, 500));
              attempts++;
            }
          } catch (error) {
            console.error("Error refreshing JWT token:", error);
            break; // Exit polling on error
          }
        }

        if (!claimsFound) {
          console.warn(
            "Local Dev Fallback or claims timeout: Supabase claims (team_id) not found in JWT after polling. Proceeding anyway, but Supabase requests may fail.",
          );
        }
      }

      if (isMounted) {
        setUser(user);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  /**
   *
   */
  const loginWithGoogleFn = async () => {
    const abortController = new AbortController();
    try {
      await loginWithGoogle(isMergingRef);
    } catch (e: any) {
      if (!abortController.signal.aborted) {
        console.error("Login failed:", e);
      }
    } finally {
      abortController.abort();
    }
  };
  /**
   *
   */
  const loginWithEmailFn = async (email: string, pass: string) => {
    await loginWithEmail(email, pass);
  };
  /**
   *
   */
  const logoutUserFn = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: loginWithGoogleFn,
        loginEmail: loginWithEmailFn,
        logout: logoutUserFn,
        isMergingRef,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
