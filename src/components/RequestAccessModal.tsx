import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles, Loader2, Check } from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { FeedbackMessage } from "../types";

interface RequestAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  user: any;
}

/**
 *
 */
export function RequestAccessModal({
  open,
  onOpenChange,
  feature,
  user,
}: RequestAccessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /**
   *
   */
  const handleRequest = async () => {
    setIsSubmitting(true);
    try {
      const feedback: Omit<FeedbackMessage, "id"> = {
        type: "Feature",
        message: `Requested early access to the ${feature} feature.`,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
      };

      await addDoc(collection(db, "alpha_feedback"), feedback);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to request access:", err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          const timer = setTimeout(() => setSubmitted(false), 300); // Reset after animation
          return () => clearTimeout(timer);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-dark/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-paper-base p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-ink-dark/10">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-xl font-serif font-semibold text-ink-dark flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-gold" />
              Upgrade to Access
            </Dialog.Title>
            <Dialog.Close className="p-1 text-ink-dark/40 rounded-lg hover:bg-ink-dark/5 hover:text-ink-dark transition-colors focus:outline-none">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-accent-teal/10 text-accent-teal flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-ink-dark mb-2">
                Request Sent!
              </h3>
              <p className="text-sm text-ink-dark/70">
                We've received your request for the {feature} feature. We'll be
                in touch soon as we roll this out to more users.
              </p>
              <Dialog.Close className="mt-6 px-4 py-2 text-sm font-medium text-white transition-colors bg-ink-dark rounded-xl shadow-sm hover:bg-ink-dark/90 focus:outline-none w-full">
                Close
              </Dialog.Close>
            </div>
          ) : (
            <>
              <Dialog.Description className="mt-2 text-sm text-ink-dark/70 leading-relaxed mb-6">
                The <strong>{feature}</strong> feature is currently only
                available to Superadmins during our Alpha phase. Request access
                to be bumped up the waitlist!
              </Dialog.Description>

              <div className="flex justify-end gap-3 mt-2">
                <Dialog.Close className="px-4 py-2 text-sm font-medium text-ink-dark transition-colors bg-white border border-ink-dark/20 rounded-xl hover:bg-ink-dark/5 focus:outline-none">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleRequest}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-ink-dark rounded-xl shadow-sm hover:bg-ink-dark/90 focus:outline-none disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Request Access
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
