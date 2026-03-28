import React, { useEffect } from "react";
import { useApprovalStore } from "../hooks/useApprovalStore";
import { Inbox, X, ArrowRight } from "lucide-react";

/**
 *
 */
export const ApprovalBanner: React.FC<{ onNavigate: () => void }> = ({
  onNavigate,
}) => {
  const { isBannerDismissed, setBannerDismissed, items, fetchInbox, loading } =
    useApprovalStore();

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  if (loading || isBannerDismissed || items.length === 0) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm relative z-50">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-full">
          <Inbox size={16} className="text-blue-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">
            Pending Data Approvals ({items.length})
          </h3>
          <p className="text-xs text-blue-700 mt-0.5">
            {items.length} raw data points need to be reviewed to maintain data
            quality.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            onNavigate();
            setBannerDismissed(true);
          }}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
        >
          Review Now <ArrowRight size={14} />
        </button>
        <button
          onClick={() => setBannerDismissed(true)}
          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
