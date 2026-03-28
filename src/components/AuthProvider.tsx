import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, loginWithEmail, logout } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginEmail: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => { /* no-op in tests */ };
  const loginWithEmail = async (email: string, pass: string) => { /* no-op in tests */ };
  const logoutUser = async () => { /* no-op in tests */ };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginWithGoogle, loginEmail: loginWithEmail, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
