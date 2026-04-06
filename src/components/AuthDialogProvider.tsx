import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthModal } from "./AuthModal";

export const AuthStateContext = createContext<{ isOpen: boolean } | null>(null);
export const AuthDispatchContext = createContext<{
  openModal: () => void;
  closeModal: () => void;
} | null>(null);

export function useAuthDialogState() {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error(
      "useAuthDialogState must be used within an AuthDialogProvider",
    );
  }
  return context;
}

export function useAuthDialogDispatch() {
  const context = useContext(AuthDispatchContext);
  if (!context) {
    throw new Error(
      "useAuthDialogDispatch must be used within an AuthDialogProvider",
    );
  }
  return context;
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <AuthStateContext.Provider value={{ isOpen }}>
      <AuthDispatchContext.Provider value={{ openModal, closeModal }}>
        {children}
        <AuthModal isOpen={isOpen} onClose={closeModal} />
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}
