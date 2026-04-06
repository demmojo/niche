import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuthDialogDispatch } from "./AuthDialogProvider";

export function PQLGateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { openModal } = useAuthDialogDispatch();

  const handleUpgrade = () => {
    onClose();
    openModal();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <Dialog.Title className="text-2xl font-black text-slate-900 mb-3 text-center">
            Unlock the Vault
          </Dialog.Title>
          <Dialog.Description className="text-slate-600 mb-6 text-center leading-relaxed">
            You've curated a strong, data-backed niche. Unlock the Vault to save
            your highlights and enter the Execution Phase.
          </Dialog.Description>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink-dark text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              Continue with Google
            </button>
            <Dialog.Close asChild>
              <button className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors mt-2">
                Discard analysis
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
