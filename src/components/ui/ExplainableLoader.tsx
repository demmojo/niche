import React from "react";
import { AuthMergeState } from "../../types/auth";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ExplainableLoaderProps {
  state: AuthMergeState;
  onRetrySync?: () => void;
}

const STATE_MESSAGES: Record<AuthMergeState, string> = {
  IDLE: "",
  REQUESTING_GRANT: "Securing workspace...",
  AWAITING_OAUTH: "Authenticating with provider...",
  RESOLVING_CONFLICT: "Resolving account conflicts...",
  EXECUTING_MERGE: "Saving data...",
  SUCCESS: "Workspace saved successfully!",
  ERROR: "Failed to sync workspace data.",
};

export const ExplainableLoader: React.FC<ExplainableLoaderProps> = ({
  state,
  onRetrySync,
}) => {
  if (state === "IDLE") return null;

  return (
    <div
      className="flex flex-col items-center justify-center p-6 space-y-4 rounded-xl bg-paper-base border border-ink-dark/10"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center space-x-3 text-ink-dark">
        {state === "SUCCESS" && (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
        {state === "ERROR" && <AlertCircle className="w-5 h-5 text-red-600" />}
        {state !== "SUCCESS" && state !== "ERROR" && (
          <Loader2 className="w-5 h-5 animate-spin text-ink-dark/60" />
        )}
        <span className="text-sm font-medium">{STATE_MESSAGES[state]}</span>
      </div>

      {state === "ERROR" && onRetrySync && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetrySync}
          className="mt-2"
        >
          Retry Sync
        </Button>
      )}
    </div>
  );
};
