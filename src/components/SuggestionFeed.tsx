import React from "react";
import { Sparkles, Info } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { DerivedInsight } from "../types";
import { MyProductData } from "./MyProduct";

interface SuggestionFeedProps {
  insights: DerivedInsight[];
  productData: MyProductData;
  onAccept: (
    featureName: string,
    description: string,
    insightId: string,
  ) => void;
}

export const SuggestionFeed: React.FC<SuggestionFeedProps> = ({
  insights,
  productData,
  onAccept,
}) => {
  const suggestions = insights.slice(0, 5); // Just take recent insights as mock features for now

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-sm font-sans mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-ochre" size={20} />
        <h3 className="text-xl font-bold text-[#2C2C2C]">
          Market-Driven Feature Suggestions
        </h3>
      </div>
      <div className="space-y-4">
        {suggestions.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-paper-base border border-ink-dark/10 rounded-lg flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-ink-dark text-sm">
                  {insight.title}
                </h4>
                <Tooltip
                  content={<span>Derived from: {insight.source}</span>}
                  position="top"
                >
                  <span className="cursor-help">
                    <Info size={14} className="text-ink-muted" />
                  </span>
                </Tooltip>
              </div>
              <p className="text-xs text-ink-muted mt-1 max-w-lg">
                {insight.description}
              </p>
            </div>
            <button
              onClick={() =>
                onAccept(insight.title, insight.description, insight.id)
              }
              className="px-3 py-1.5 text-xs font-medium bg-ink-dark text-white rounded hover:bg-black transition-colors"
            >
              Add to Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
