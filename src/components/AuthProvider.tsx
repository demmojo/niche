import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, loginWithGoogle, loginWithEmail, logout } from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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

      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogleFn = async () => {
    await loginWithGoogle();
  };
  const loginWithEmailFn = async (email: string, pass: string) => {
    await loginWithEmail(email, pass);
  };
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
