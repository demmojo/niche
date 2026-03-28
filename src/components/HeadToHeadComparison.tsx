import React, { useMemo } from "react";
import { ArrowLeft, Check, Minus, Target } from "lucide-react";
import { Tooltip } from "./Tooltip";
import Markdown from "react-markdown";
import { MyProductData, ProductFeature } from "./MyProduct";

interface Competitor {
  id: string;
  name: string;
  coreFeatures?: string[];
  targetAudience?: string;
  pricingStrategy?: string;
  integrations?: string[];
}

interface HeadToHeadComparisonProps {
  competitorIds: string[];
  competitors: Competitor[];
  myProductData: MyProductData;
  onBack: () => void;
}

export const HeadToHeadComparison: React.FC<HeadToHeadComparisonProps> = ({
  competitorIds,
  competitors,
  myProductData,
  onBack,
}) => {
  const selectedCompetitors = useMemo(() => {
    return competitorIds
      .map((id) => competitors.find((c) => c.id === id))
      .filter(Boolean) as Competitor[];
  }, [competitorIds, competitors]);

  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();

    // Add My Product features
    myProductData.features.forEach((f) => {
      featureSet.add(f.name.toLowerCase().trim());
    });

    // Add Competitor features
    selectedCompetitors.forEach((c) => {
      if (c.coreFeatures) {
        c.coreFeatures.forEach((f) => {
          featureSet.add(f.toLowerCase().trim());
        });
      }
    });

    return Array.from(featureSet).sort();
  }, [myProductData, selectedCompetitors]);

  const hasFeature = (productName: string, featureName: string) => {
    const fName = featureName.toLowerCase().trim();
    if (productName === myProductData.name || productName === "My Product") {
      return myProductData.features.some(
        (f) => f.name.toLowerCase().trim() === fName,
      );
    }

    const competitor = selectedCompetitors.find((c) => c.name === productName);
    if (competitor && competitor.coreFeatures) {
      return competitor.coreFeatures.some(
        (f) => f.toLowerCase().trim() === fName,
      );
    }

    return false;
  };

  const getIntegrations = (productName: string) => {
    if (productName === myProductData.name || productName === "My Product") {
      return "N/A"; // Or handle if myProductData adds integrations
    }
    const competitor = selectedCompetitors.find((c) => c.name === productName);
    return competitor?.integrations
      ? competitor.integrations.join(", ")
      : "None";
  };

  const getTargetAudience = (productName: string) => {
    if (productName === myProductData.name || productName === "My Product") {
      return myProductData.targetAudience || "N/A";
    }
    const competitor = selectedCompetitors.find((c) => c.name === productName);
    return competitor?.targetAudience || "Unknown";
  };

  const getPricing = (productName: string) => {
    if (productName === myProductData.name || productName === "My Product") {
      return "N/A";
    }
    const competitor = selectedCompetitors.find((c) => c.name === productName);
    return competitor?.pricingStrategy || "Unknown";
  };

  const columns = ["My Product", ...selectedCompetitors.map((c) => c.name)];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#8A8A8A] hover:text-ink-dark transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h2 className="text-xl font-bold text-ink-dark">
            Head-to-Head Comparison
          </h2>
          <p className="text-sm text-[#8A8A8A]">
            Compare your product features side-by-side
          </p>
        </div>
      </div>

      <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-xl overflow-x-auto">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3 border-b-2 border-ink-dark/20 w-1/4">
                  Feature
                </th>
                {columns.map((colName) => (
                  <th
                    key={colName}
                    className="px-4 py-3 border-b-2 border-ink-dark/20 text-center text-ink-dark font-bold"
                  >
                    {colName === "My Product" && myProductData.name
                      ? myProductData.name
                      : colName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Target Audience Row */}
              <tr className="bg-paper-base/30">
                <td className="px-4 py-3 border-b border-ink-dark/10 font-semibold flex items-center gap-2">
                  <Target size={14} className="text-ink-dark/60" /> Target
                  Audience
                </td>
                {columns.map((colName) => (
                  <td
                    key={colName}
                    className="px-4 py-3 border-b border-ink-dark/10 text-center"
                  >
                    <span className="text-xs text-ink-dark/80 bg-ink-dark/5 px-2 py-1 rounded">
                      {getTargetAudience(colName)}
                    </span>
                  </td>
                ))}
              </tr>
              {/* Pricing Row */}
              <tr className="bg-paper-base/30">
                <td className="px-4 py-3 border-b border-ink-dark/10 font-semibold">
                  Pricing Strategy
                </td>
                {columns.map((colName) => (
                  <td
                    key={colName}
                    className="px-4 py-3 border-b border-ink-dark/10 text-center text-xs"
                  >
                    <div className="prose prose-sm inline-block text-left">
                      <Markdown>{getPricing(colName)}</Markdown>
                    </div>
                  </td>
                ))}
              </tr>
              {/* Integrations Row */}
              <tr className="bg-paper-base/30">
                <td className="px-4 py-3 border-b border-ink-dark/10 font-semibold">
                  Integrations
                </td>
                {columns.map((colName) => (
                  <td
                    key={colName}
                    className="px-4 py-3 border-b border-ink-dark/10 text-center text-xs"
                  >
                    {getIntegrations(colName)}
                  </td>
                ))}
              </tr>

              {/* Core Features */}
              {allFeatures.map((feature) => (
                <tr
                  key={feature}
                  className="hover:bg-paper-base/50 transition-colors"
                >
                  <td className="px-4 py-3 border-b border-ink-dark/10 capitalize text-ink-dark/80">
                    {feature}
                  </td>
                  {columns.map((colName) => (
                    <td
                      key={colName}
                      className="px-4 py-3 border-b border-ink-dark/10 text-center"
                    >
                      {hasFeature(colName, feature) ? (
                        <Check size={16} className="text-emerald-500 mx-auto" />
                      ) : (
                        <Minus size={16} className="text-ink-dark/20 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Layout (Card Row) */}
        <div className="block md:hidden space-y-8">
          {columns.map((colName) => (
            <div
              key={colName}
              className="bg-paper-base rounded-lg border border-ink-dark/20 p-4"
            >
              <h3 className="text-lg font-bold text-ink-dark mb-4 text-center border-b border-ink-dark/10 pb-2">
                {colName === "My Product" && myProductData.name
                  ? myProductData.name
                  : colName}
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-ink-dark/60 uppercase font-semibold mb-1">
                    Target Audience
                  </div>
                  <div className="bg-white p-2 rounded border border-ink-dark/10">
                    {getTargetAudience(colName)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-dark/60 uppercase font-semibold mb-1">
                    Pricing Strategy
                  </div>
                  <div className="bg-white p-2 rounded border border-ink-dark/10">
                    <div className="prose prose-sm">
                      <Markdown>{getPricing(colName)}</Markdown>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-dark/60 uppercase font-semibold mb-1">
                    Integrations
                  </div>
                  <div className="bg-white p-2 rounded border border-ink-dark/10">
                    {getIntegrations(colName)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-dark/60 uppercase font-semibold mb-2">
                    Core Features
                  </div>
                  <div className="bg-white rounded border border-ink-dark/10 divide-y divide-ink-dark/10">
                    {allFeatures.map((feature) => {
                      const present = hasFeature(colName, feature);
                      return (
                        <div
                          key={feature}
                          className="p-2 flex justify-between items-center"
                        >
                          <span
                            className={`capitalize ${present ? "text-ink-dark" : "text-ink-dark/40"}`}
                          >
                            {feature}
                          </span>
                          {present ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Minus size={14} className="text-ink-dark/20" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
