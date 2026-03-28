import React from "react";
import { tMessage } from "../content/dictionary";
import { Download, Lock } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { checkSubscriptionTier } from "../utils/subscription";

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
  tooltipText?: string;
  actionName?: string;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  label = "Export",
  tooltipText = "Export Data",
  actionName = "export_data",
  className = "",
}) => {
  const handleExport = () => {
    // Stub check for subscription tier
    const isAllowed = checkSubscriptionTier(actionName, "free");

    if (isAllowed) {
      onExport();
    } else {
      // In the future: Show upgrade modal here
      console.warn(
        `Action ${actionName} is blocked by subscription tier limitations.`,
      );
    }
  };

  return (
    <Tooltip content={tMessage(tooltipText)} position="top">
      <button
        onClick={handleExport}
        className={`flex items-center space-x-2 px-3 py-1.5 bg-ink-dark/30 hover:bg-ink-dark/50 text-paper-light text-sm rounded-md transition-colors border border-ink-light/20 ${className}`}
      >
        <Download size={16} className="text-accent-teal" />
        <span>{label}</span>
      </button>
    </Tooltip>
  );
};

export default ExportButton;
