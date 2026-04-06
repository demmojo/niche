import React, { useState } from "react";
import { useIsMounted } from "../hooks/useIsMounted";
import { auth } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  linkWithCredential,
  OAuthProvider,
  EmailAuthProvider,
  AuthCredential,
} from "firebase/auth";
import { X, Loader2 } from "lucide-react";
import { safeStorageGet, safeStorageSet } from "../utils/storage";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const isMounted = useIsMounted();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingCredential, setPendingCredential] =
    useState<AuthCredential | null>(null);

  // View states: 'login' | 'merge_prompt'
  const [view, setView] = useState<"login" | "merge_prompt">("login");

  if (!isOpen) return null;

  const isDirty = () => {
    const wid = safeStorageGet("nicheai_workspace_id");
    if (!wid) return false;
    let hasData = false;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${wid}_`)) {
        hasData = true;
        break;
      }
    }
    return hasData;
  };

  const persistToDefensiveStorage = () => {
    const wid = safeStorageGet("nicheai_workspace_id");
    if (!wid) return;
    const data: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${wid}_`)) {
        data[key] = window.localStorage.getItem(key) || "";
      }
    }
    safeStorageSet("nicheai_pending_merge", JSON.stringify(data));
  };

  const handleGoogleLogin = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    const wasAnonymous = auth.currentUser?.isAnonymous;

    try {
      const provider = new GoogleAuthProvider();

      if (wasAnonymous) {
        await linkWithPopup(auth.currentUser, provider);
        await auth.currentUser?.reload();
        if (!isMounted.current) return;
        onClose();
      } else {
        await signInWithPopup(auth, provider);
        if (!isMounted.current) return;
        onClose();
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      if (err && typeof err === "object" && "code" in err && "message" in err) {
        const firebaseErr = err as { code: string; message: string };

        if (
          firebaseErr.code === "auth/popup-closed-by-user" ||
          firebaseErr.code === "auth/popup-blocked" ||
          firebaseErr.code === "auth/cancelled-popup-request"
        ) {
          setLoading(false);
          return;
        }

        if (firebaseErr.code === "auth/credential-already-in-use") {
          const credential = OAuthProvider.credentialFromError(
            firebaseErr as any,
          );
          if (credential) {
            if (!isDirty()) {
              await signInWithCredential(auth, credential);
              await auth.currentUser?.reload();
              if (!isMounted.current) return;
              onClose();
            } else {
              setPendingCredential(credential);
              setView("merge_prompt");
            }
          } else {
            setError(firebaseErr.message);
          }
        } else {
          setError(firebaseErr.message);
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      if (isMounted.current && view === "login") {
        setLoading(false);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    const wasAnonymous = auth.currentUser?.isAnonymous;

    try {
      if (wasAnonymous) {
        // Technically linkWithCredential is the standard way to upgrade with email/password, but usually it involves an EmailAuthProvider credential.
        // If we want to catch already-in-use, let's try linkWithCredential or handle it differently.
        const credential = EmailAuthProvider.credential(email, password);
        try {
          if (auth.currentUser) {
            await linkWithCredential(auth.currentUser, credential);
            await auth.currentUser?.reload();
          }
          if (!isMounted.current) return;
          onClose();
        } catch (linkErr: any) {
          if (
            linkErr.code === "auth/email-already-in-use" ||
            linkErr.code === "auth/credential-already-in-use"
          ) {
            if (!isDirty()) {
              await signInWithEmailAndPassword(auth, email, password);
              await auth.currentUser?.reload();
              if (!isMounted.current) return;
              onClose();
            } else {
              setPendingCredential(credential);
              setView("merge_prompt");
            }
          } else {
            throw linkErr;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        if (!isMounted.current) return;
        onClose();
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      if (err && typeof err === "object" && "code" in err && "message" in err) {
        const firebaseErr = err as { code: string; message: string };
        setError(firebaseErr.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      if (isMounted.current && view === "login") {
        setLoading(false);
      }
    }
  };

  const handleMerge = async () => {
    if (!isMounted.current || !pendingCredential) return;
    setLoading(true);
    setError(null);
    try {
      persistToDefensiveStorage();
      await signInWithCredential(auth, pendingCredential);
      await auth.currentUser?.reload();
      if (!isMounted.current) return;
      onClose();
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(
        err.message || "Failed to merge workspace data. Please try again.",
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDiscard = async () => {
    if (!isMounted.current || !pendingCredential) return;
    setLoading(true);
    try {
      await signInWithCredential(auth, pendingCredential);
      await auth.currentUser?.reload();
      if (!isMounted.current) return;
      onClose();
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err.message || "Failed to sign in.");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {view === "login" ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-ink-dark">
                  Welcome back
                </h2>
                <p className="text-ink-dark/60 mt-2">
                  Log in to save your current workspace.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-ink-dark font-medium py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {loading && view === "login" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span aria-live="polite">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-5 h-5"
                    />
                    Sign in with Google
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-400">
                    or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ink-dark/20 focus:border-ink-dark transition-all"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ink-dark/20 focus:border-ink-dark transition-all"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ink-dark text-white font-bold py-3 px-4 rounded-xl hover:bg-ink-dark/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && view === "login" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span aria-live="polite">Authenticating...</span>
                    </>
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 animate-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-ink-dark mb-4">
                Conflict Detected
              </h2>
              <p className="text-ink-dark/70 mb-8">
                You have unsaved workspace data from your anonymous session.
                What would you like to do?
              </p>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-left">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleMerge}
                  disabled={loading}
                  className="w-full bg-ink-dark text-white font-bold py-3 px-4 rounded-xl hover:bg-ink-dark/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span aria-live="polite">Merging workspace...</span>
                    </>
                  ) : (
                    "Merge into my account"
                  )}
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={loading}
                  className="w-full bg-white border border-red-200 text-red-600 font-bold py-3 px-4 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Discard unsaved work
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
