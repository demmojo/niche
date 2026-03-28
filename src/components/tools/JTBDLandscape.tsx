import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from "recharts";
import { JobToBeDone } from "../../types";
import { useMarketIntelligence } from "../../hooks/useMarketIntelligence";
import { Loader2 } from "lucide-react";

/**
 *
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: JobToBeDone = payload[0].payload;
    return (
      <div className="bg-white border border-ink-dark/20 p-4 rounded-xl shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-bold text-ink-dark text-sm">
            {data.jobStatement}
          </h4>
          {data.confidenceScore < 0.8 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Low Confidence
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-ink-dark/70 mb-3">
          <div>Importance: {data.importanceScore}/10</div>
          <div>Satisfaction: {data.currentSatisfactionScore}/10</div>
          <div className="col-span-2 font-bold text-sky">
            Opportunity Score: {data.opportunityScore}
          </div>
        </div>

        {data.verbatimQuotes.length > 0 && (
          <div className="border-t border-ink-dark/10 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-dark/50 font-bold mb-1">
              Verbatim Quotes (Exa AI Sync)
            </p>
            <ul className="text-xs text-ink-dark/80 italic space-y-1">
              {data.verbatimQuotes.map((quote, idx) => (
                <li key={idx}>"{quote}"</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 *
 */
export const JTBDLandscape: React.FC = () => {
  const fetchState = useMarketIntelligence<JobToBeDone>("market_jtbds");

  const data = useMemo(() => {
    if (fetchState.status !== "success") return [];
    
    return fetchState.data.map((item) => ({
      ...item,
      // For Recharts Scatter
      x: item.currentSatisfactionScore,
      y: item.importanceScore,
      z: item.opportunityScore,
    }));
  }, [fetchState]);

  if (fetchState.status === "loading" || fetchState.status === "idle") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-ink-dark/60">
          <Loader2 className="animate-spin w-8 h-8" />
          <p className="font-serif">Loading JTBD Landscape...</p>
        </div>
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-rose-200 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="text-rose-600 font-bold">Failed to load JTBDs</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold font-serif text-ink-dark mb-2">
          JTBD Opportunity Landscape
        </h3>
        <p className="text-sm text-ink-dark/70">
          Stop guessing what users want. This maps out exactly which "Jobs to be
          Done" are highly important to your target market but terribly served
          by current solutions (top-left quadrant).
        </p>
      </div>

      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />

            {/* Underserved Area */}
            <ReferenceArea
              x1={0}
              x2={5}
              y1={5}
              y2={10}
              fill="rgba(14, 165, 233, 0.05)"
            />
            {/* Overserved Area */}
            <ReferenceArea
              x1={5}
              x2={10}
              y1={0}
              y2={5}
              fill="rgba(107, 114, 128, 0.05)"
            />

            <XAxis
              type="number"
              dataKey="x"
              name="Satisfaction"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              label={{
                value: "Current Satisfaction (1-10)",
                position: "bottom",
                offset: -5,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Importance"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              label={{
                value: "Job Importance (1-10)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Scatter name="Jobs" data={data}>
              {data.map((entry, index) => {
                const isHighConfidence = entry.confidenceScore >= 0.8;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighConfidence ? "#6366f1" : "#f59e0b"} // Indigo for High Confidence
                    fillOpacity={isHighConfidence ? 0.8 : 0.5}
                    stroke={isHighConfidence ? "#4f46e5" : "#d97706"}
                    strokeDasharray={isHighConfidence ? "0" : "4 4"}
                    strokeWidth={2}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
