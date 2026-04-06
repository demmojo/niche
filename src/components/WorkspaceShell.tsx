import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Target, UserCircle } from "lucide-react";
import { useUserProfile } from "../hooks/useUserProfile";
import { db } from "../firebase";
import { FounderProvider } from "./FounderProvider";
import { EnterpriseProvider } from "./EnterpriseProvider";
import { ZeroFrictionEntry } from "./ZeroFrictionEntry";

// These will be defined separately
import { FounderWorkspace } from "./FounderWorkspace";
import { EnterpriseWorkspace } from "./EnterpriseWorkspace";
import { AuthModal } from "./AuthModal";

export function WorkspaceShell({ logout }: { logout: () => void }) {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [impersonatedPersona, setImpersonatedPersona] = useState<string | null>(
    null,
  );
  const [isEntryFlowActive, setIsEntryFlowActive] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Background migration for legacy users
  useEffect(() => {
    if (user && !user.isAnonymous && profile && !profile.persona) {
      // Legacy user without a persona
      import("firebase/firestore").then(({ doc, setDoc }) => {
        setDoc(
          doc(db, "users", user.uid),
          { persona: "solo_founder" },
          { merge: true },
        );
      });
    }
  }, [user, profile]);

  if (profileLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-[#F5F3ED]"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink-dark mb-4"></div>
        <p className="text-sm font-medium text-ink-dark/60">
          Loading Workspace...
        </p>
      </div>
    );
  }

  // Effective persona considers superadmin impersonation
  const isSuperadmin =
    user?.email === "mo.hassaniv@gmail.com" || user?.email === "admin@test.com";
  let effectivePersona = profile?.persona;

  if (isSuperadmin && impersonatedPersona) {
    effectivePersona = impersonatedPersona as any;
  }

  // Account settings toggle
  const switchWorkspace = () => {
    const newPersona =
      effectivePersona === "solo_founder" ? "enterprise_pm" : "solo_founder";
    import("firebase/firestore").then(({ doc, setDoc }) => {
      setDoc(
        doc(db, "users", user!.uid),
        { persona: newPersona },
        { merge: true },
      );
    });
  };

  // If no persona is set (and no product/idea yet), we show the Zero Friction Entry
  // We use `isEntryFlowActive` to lock them in the entry flow even after persona is set mid-flow
  if (!effectivePersona || isEntryFlowActive) {
    return (
      <>
        <ZeroFrictionEntry
          onIntentSelected={() => setIsEntryFlowActive(true)}
          onComplete={(data) => {
            setIsEntryFlowActive(false);
          }}
          onLoginClick={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Global Navigation Shell */}
      <div className="h-14 bg-white border-b border-ink-dark/10 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-ink-dark">
            <Target className="w-5 h-5" /> NicheAI
          </div>
          <div className="w-px h-6 bg-ink-dark/10"></div>

          <span className="text-sm text-ink-dark/60 font-medium tracking-wide">
            {effectivePersona === "enterprise_pm"
              ? "Enterprise Command Center"
              : "Founder Workspace"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-ink-dark/70">
          {!isSuperadmin && effectivePersona === "solo_founder" && (
            <div className="hidden md:flex items-center gap-2 mr-4 border-r border-ink-dark/10 pr-4">
              <span className="text-xs text-ink-dark/50 italic">
                Are you an Enterprise PM?
              </span>
              <button
                onClick={switchWorkspace}
                className="text-xs font-bold text-ink-dark hover:underline"
              >
                Switch Workspace
              </button>
            </div>
          )}
          {!isSuperadmin && effectivePersona === "enterprise_pm" && (
            <div className="hidden md:flex items-center gap-2 mr-4 border-r border-ink-dark/10 pr-4">
              <span className="text-xs text-ink-dark/50 italic">
                Are you a Solo Founder?
              </span>
              <button
                onClick={switchWorkspace}
                className="text-xs font-bold text-ink-dark hover:underline"
              >
                Switch Workspace
              </button>
            </div>
          )}
          {isSuperadmin && (
            <div className="flex items-center gap-2 mr-4 border-r border-ink-dark/10 pr-4">
              <span className="text-xs uppercase tracking-wider text-ink-dark/50">
                Impersonate:
              </span>
              <select
                className="bg-gray-50 border border-ink-dark/20 rounded px-2 py-1 text-xs"
                value={impersonatedPersona || ""}
                onChange={(e) => setImpersonatedPersona(e.target.value || null)}
              >
                <option value="">None (Use Profile)</option>
                <option value="solo_founder">Founder</option>
                <option value="enterprise_pm">Enterprise PM</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 opacity-50" />
            <span>{user?.email || "Anonymous"}</span>
          </div>

          {user?.isAnonymous && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-ink-dark transition-colors ml-4 text-ink-dark/50 hover:text-ink-dark/80 underline font-medium"
            >
              Log In
            </button>
          )}

          {!user?.isAnonymous && user?.email && (
            <button
              onClick={logout}
              className="hover:text-ink-dark transition-colors ml-4 text-ink-dark/50 hover:text-ink-dark/80"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Render the specific workspace */}
      <div className="flex-1 overflow-hidden relative">
        {effectivePersona === "enterprise_pm" ? (
          <EnterpriseProvider>
            <EnterpriseWorkspace isSuperadmin={isSuperadmin} />
          </EnterpriseProvider>
        ) : (
          <FounderProvider>
            <FounderWorkspace user={user} isSuperadmin={isSuperadmin} />
          </FounderProvider>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
