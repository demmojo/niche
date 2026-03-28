import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Mail } from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  user: any;
}

/**
 *
 */
export function InviteMemberModal({
  open,
  onOpenChange,
  workspaceId,
  user,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   *
   */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !workspaceId) return;

    setIsSubmitting(true);
    try {
      const token = crypto.randomUUID();

      const inviteData = {
        token,
        workspaceId,
        email: email.trim(),
        status: "pending",
        invitedBy: user.uid,
        createdAt: serverTimestamp(),
        // Extension trigger email logic
        message: {
          to: email.trim(),
          message: {
            subject: `You've been invited to a NicheAI Workspace`,
            html: `
              <p>Hi there,</p>
              <p>You have been invited to collaborate on a NicheAI Workspace.</p>
              <p><a href="https://app.nicheai.com/invite?token=${token}">Click here to join</a></p>
            `,
          },
        },
      };

      await addDoc(collection(db, "invites"), inviteData);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setEmail("");
      }, 2000);
    } catch (err) {
      console.error("Failed to send invite:", err);
      alert("Failed to send invite. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-dark/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-paper-base p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-ink-dark/10">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-xl font-serif font-semibold text-ink-dark flex items-center gap-2">
              <Mail className="w-5 h-5 text-ink-dark" />
              Invite Team Member
            </Dialog.Title>
            <Dialog.Close className="p-1 text-ink-dark/40 rounded-lg hover:bg-ink-dark/5 hover:text-ink-dark transition-colors focus:outline-none">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {success ? (
            <div className="py-8 text-center">
              <p className="text-accent-teal font-medium mb-2">
                Invitation Sent!
              </p>
              <p className="text-sm text-ink-dark/70">
                An email has been sent to {email}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInvite}>
              <Dialog.Description className="mt-2 text-sm text-ink-dark/70 leading-relaxed mb-6">
                Send an invitation to collaborate. The user will receive an
                email with a secure link to join this workspace.
              </Dialog.Description>

              <div className="mb-6">
                <label className="block text-sm font-medium text-ink-dark mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full px-4 py-2 bg-white border border-ink-dark/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ink-dark/20 text-ink-dark placeholder:text-ink-dark/30"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Dialog.Close
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-ink-dark transition-colors bg-white border border-ink-dark/20 rounded-xl hover:bg-ink-dark/5 focus:outline-none"
                >
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-ink-dark rounded-xl shadow-sm hover:bg-ink-dark/90 focus:outline-none disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Invite
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
