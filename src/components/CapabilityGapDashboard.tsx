import React from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Activity,
  Percent,
} from "lucide-react";
import { MyProductData } from "./MyProduct";
import { Competitor } from "../types";
import { Tooltip } from "./Tooltip";

interface CapabilityGapDashboardProps {
  productData: MyProductData;
  competitors: Competitor[];
}

/**
 *
 */
export const CapabilityGapDashboard: React.FC<CapabilityGapDashboardProps> = ({
  productData,
  competitors,
}) => {
  // Mock logic to compare product features with competitor features
  const allCompetitorFeatures = Array.from(
    new Set(competitors.flatMap((c) => c.features || [])),
  );
  const myFeatureNames = productData.features.map((f) => f.name.toLowerCase());

  const capabilityGaps = allCompetitorFeatures.filter(
    (f) => !myFeatureNames.some((mf) => mf.includes(f.toLowerCase())),
  );
  const commonFeatures = allCompetitorFeatures.filter((f) =>
    myFeatureNames.some((mf) => mf.includes(f.toLowerCase())),
  );

  const parityScore = Math.round(
    (commonFeatures.length / (allCompetitorFeatures.length || 1)) * 100,
  );

  return (
    <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="text-emerald-500" size={24} />
          <h3 className="text-xl font-bold text-ink-dark">
            Capability Gap Analysis
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
          <Percent size={16} className="text-emerald-600" />
          <span className="font-bold text-emerald-700">
            Market Parity: {parityScore}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-paper-base border border-ink-dark/10 rounded-xl p-5">
          <h4 className="font-bold text-ink-dark flex items-center gap-2 mb-4">
            <XCircle className="text-terracotta" size={18} /> Capability Gaps
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {capabilityGaps.length > 0 ? (
              capabilityGaps.map((gap, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white border border-ink-dark/10 rounded-lg"
                >
                  <span className="text-sm font-medium text-ink-dark">
                    {gap}
                  </span>
                  <button className="text-xs font-bold text-ink-dark hover:text-sky transition-colors flex items-center gap-1">
                    Add <ChevronRight size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted italic">
                You have parity with all known competitor features.
              </p>
            )}
          </div>
        </div>

        <div className="bg-paper-base border border-ink-dark/10 rounded-xl p-5">
          <h4 className="font-bold text-ink-dark flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-emerald-500" size={18} /> Met
            Capabilities
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {commonFeatures.length > 0 ? (
              commonFeatures.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 bg-white border border-emerald-100 rounded-lg"
                >
                  <CheckCircle2
                    className="text-emerald-500 shrink-0"
                    size={16}
                  />
                  <span className="text-sm font-medium text-ink-dark">
                    {feat}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted italic">
                No matching capabilities yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
