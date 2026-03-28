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
  ReferenceLine,
  Cell,
} from "recharts";
import { Assumption } from "../../types";
import { useMarketIntelligence } from "../../hooks/useMarketIntelligence";
import { Loader2 } from "lucide-react";

/**
 *
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: Assumption = payload[0].payload;
    return (
      <div className="bg-white border border-ink-dark/20 p-4 rounded-xl shadow-lg max-w-sm">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-ink-dark/5 text-ink-dark/70 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              {data.category}
            </span>
            {data.confidenceScore < 0.8 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Low Confidence
              </span>
            )}
          </div>
          <h4 className="font-bold text-ink-dark text-sm">{data.statement}</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-ink-dark/70 mb-3">
          <div>Importance: {data.importanceScore}/10</div>
          <div>Evidence Strength: {data.evidenceStrength}/10</div>
        </div>

        {data.verbatimQuotes.length > 0 && (
          <div className="border-t border-ink-dark/10 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-dark/50 font-bold mb-1">
              Verbatim Quotes (Evidence)
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
export const AssumptionMapping: React.FC = () => {
  const fetchState = useMarketIntelligence<Assumption>("market_assumptions");

  const data = useMemo(() => {
    if (fetchState.status !== "success") return [];
    return fetchState.data.map((item) => ({
      ...item,
      // For Recharts Scatter
      x: item.evidenceStrength,
      y: item.importanceScore,
      z: 1, // Fixed size
    }));
  }, [fetchState]);

  if (fetchState.status === "loading" || fetchState.status === "idle") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-ink-dark/60">
          <Loader2 className="animate-spin w-8 h-8" />
          <p className="font-serif">Loading Assumption Mapping...</p>
        </div>
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-rose-200 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="text-rose-600 font-bold">
          Failed to load Assumptions
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold font-serif text-ink-dark mb-2">
          Assumption Mapping (RAT)
        </h3>
        <p className="text-sm text-ink-dark/70">
          Identify the blind spots that could kill your business. Focus your
          validation efforts on the "Test Immediately" zone (top-left), where
          assumptions are highly critical but completely unproven.
        </p>
      </div>

      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />

            {/* High Importance, Low Evidence (Test Immediately) */}
            <ReferenceArea
              x1={0}
              x2={5}
              y1={5}
              y2={10}
              fill="rgba(244, 63, 94, 0.05)"
            />
            {/* High Evidence, High Importance (Execute) */}
            <ReferenceArea
              x1={5}
              x2={10}
              y1={5}
              y2={10}
              fill="rgba(34, 197, 94, 0.05)"
            />

            <ReferenceLine x={5} stroke="#666" strokeDasharray="3 3" />
            <ReferenceLine y={5} stroke="#666" strokeDasharray="3 3" />

            <XAxis
              type="number"
              dataKey="x"
              name="Evidence"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              label={{
                value: "Evidence Strength (Time-Decayed)",
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
                value: "Importance to Success",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Scatter name="Assumptions" data={data}>
              {data.map((entry, index) => {
                const isHighConfidence = entry.confidenceScore >= 0.8;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighConfidence ? "#f43f5e" : "#f59e0b"} // Rose for High Confidence
                    fillOpacity={isHighConfidence ? 0.8 : 0.5}
                    stroke={isHighConfidence ? "#e11d48" : "#d97706"}
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
