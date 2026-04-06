import React, { useState } from "react";
import { useIsMounted } from "../hooks/useIsMounted";
import { auth } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
import { X, Loader2, Mail } from "lucide-react";

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

  // View states: 'login' | 'merge_prompt'
  const [view, setView] = useState<"login" | "merge_prompt">("login");

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    const wasAnonymous = auth.currentUser?.isAnonymous;

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      if (!isMounted.current) return;

      if (wasAnonymous) {
        setView("merge_prompt");
      } else {
        onClose();
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      if (err && typeof err === "object" && "code" in err && "message" in err) {
        const firebaseErr = err as { code: string; message: string };
        if (firebaseErr.code === "auth/popup-closed-by-user") {
          // Graceful handling, just reset loading
          setLoading(false);
          return;
        }
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    const wasAnonymous = auth.currentUser?.isAnonymous;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (!isMounted.current) return;

      if (wasAnonymous) {
        setView("merge_prompt");
      } else {
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
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    try {
      // In a full implementation, we'd fire an AbortController-backed sync via a utility
      // e.g. await mergeAnonymousData(workspace.id, auth.currentUser.uid, abortController.signal);

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!isMounted.current) return;
      onClose();
    } catch (err) {
      if (!isMounted.current) return;
      setError("Failed to merge workspace data. Please try again.");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDiscard = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      // Simulate network request to clear orphaned workspace or local storage
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!isMounted.current) return;
      onClose();
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
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
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
                  {loading ? (
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
