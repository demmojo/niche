import React from "react";
import { Button } from "./Button";
import { LockIcon } from "lucide-react";

interface ValuePreservationBannerProps {
  onSave: () => void;
  isStreaming?: boolean;
}

export const ValuePreservationBanner: React.FC<
  ValuePreservationBannerProps
> = ({ onSave, isStreaming = false }) => {
  return (
    <div className="w-full bg-paper-base border border-ink-dark/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col">
        <h3 className="font-bold text-ink-dark text-lg flex items-center gap-2">
          <LockIcon className="w-4 h-4" />
          Secure Your Workspace
        </h3>
        <p className="text-ink-dark/70 text-sm">
          This is a temporary workspace. Connect your account to permanently
          save your research and unlock sharing.
        </p>
      </div>
      <Button
        variant="primary"
        onClick={onSave}
        disabled={isStreaming}
        className="w-full sm:w-auto flex-shrink-0"
        title={
          isStreaming
            ? "Wait for generation to complete before saving"
            : "Connect account to save"
        }
      >
        Save Workspace
      </Button>
    </div>
  );
};
