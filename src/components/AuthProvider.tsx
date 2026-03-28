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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
