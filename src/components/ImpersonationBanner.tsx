import React, { useEffect, useState } from "react";
import { stopImpersonation } from "../firebase";
import { AlertTriangle, LogOut } from "lucide-react";

export const ImpersonationBanner: React.FC = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const handleStateChange = () => {
      // Check if impersonation app exists
      const isImp = !!(window as any).__niche_impersonating;
      setIsImpersonating(isImp);
    };

    window.addEventListener("auth-state-changed", handleStateChange);
    handleStateChange();

    return () => {
      window.removeEventListener("auth-state-changed", handleStateChange);
    };
  }, []);

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-accent-coral/90 text-white z-[9999] px-4 py-2 flex items-center justify-between shadow-md backdrop-blur-sm border-b border-accent-coral/20 font-sans">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="animate-pulse" />
        <p className="text-sm font-bold tracking-wide">
          <span className="opacity-80">IMPERSONATION MODE:</span> All actions
          are audited.
        </p>
      </div>
      <button
        onClick={async () => {
          await stopImpersonation();
          window.location.href = "/";
        }}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"
      >
        <LogOut size={14} />
        Exit Impersonation
      </button>
    </div>
  );
};
