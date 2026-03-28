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
import { SentimentInsight } from "../../types";
import { useMarketIntelligence } from "../../hooks/useMarketIntelligence";
import { Loader2 } from "lucide-react";

/**
 *
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: SentimentInsight = payload[0].payload;
    return (
      <div className="bg-white border border-ink-dark/20 p-4 rounded-xl shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-bold text-ink-dark">{data.featureName}</h4>
          {data.confidenceScore < 0.8 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Low Confidence
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-ink-dark/70 mb-3">
          <div>Prevalence: {(data.prevalenceScore * 100).toFixed(0)}%</div>
          <div>
            Dissatisfaction: {(data.dissatisfactionScore * 100).toFixed(0)}%
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
export const CompetitorFeatureGap: React.FC = () => {
  const fetchState = useMarketIntelligence<SentimentInsight>(
    "market_sentiment_insights",
  );

  const data = useMemo(() => {
    if (fetchState.status !== "success") return [];
    return fetchState.data.map((item) => ({
      ...item,
      // For Recharts Scatter
      x: item.prevalenceScore * 100,
      y: item.dissatisfactionScore * 100,
      z: item.confidenceScore * 100, // Size mapped to z-axis conceptually
    }));
  }, [fetchState]);

  if (fetchState.status === "loading" || fetchState.status === "idle") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-ink-dark/60">
          <Loader2 className="animate-spin w-8 h-8" />
          <p className="font-serif">Loading Feature Gap data...</p>
        </div>
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-rose-200 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="text-rose-600 font-bold">
          Failed to load Sentiment Insights
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold font-serif text-ink-dark mb-2">
          Feature Gap & Sentiment Matrix
        </h3>
        <p className="text-sm text-ink-dark/70">
          Find out exactly what your competitors' customers hate. The top-right
          quadrant shows features that everyone offers, but everyone does
          poorly—this is your best opportunity to steal their users.
        </p>
      </div>

      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />

            <ReferenceArea
              x1={50}
              x2={100}
              y1={50}
              y2={100}
              fill="rgba(239, 68, 68, 0.05)"
            />
            <ReferenceArea
              x1={0}
              x2={50}
              y1={0}
              y2={50}
              fill="rgba(34, 197, 94, 0.05)"
            />

            <XAxis
              type="number"
              dataKey="x"
              name="Prevalence"
              unit="%"
              domain={[0, 100]}
              label={{
                value: "Feature Prevalence",
                position: "bottom",
                offset: -5,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Dissatisfaction"
              unit="%"
              domain={[0, 100]}
              label={{
                value: "User Dissatisfaction",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Scatter name="Features" data={data}>
              {data.map((entry, index) => {
                const isHighConfidence = entry.confidenceScore >= 0.8;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighConfidence ? "#0ea5e9" : "#f59e0b"}
                    fillOpacity={isHighConfidence ? 0.8 : 0.5}
                    stroke={isHighConfidence ? "#0284c7" : "#d97706"}
                    strokeDasharray={isHighConfidence ? "0" : "4 4"}
                    strokeWidth={2}
                  />
                );
              })}
            </Scatter>
            {/* Optional text labels if we wanted them directly on chart */}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
