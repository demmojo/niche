import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ValueFactor } from "../../types";
import { useMarketIntelligence } from "../../hooks/useMarketIntelligence";
import { Loader2 } from "lucide-react";

/**
 *
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-ink-dark/20 p-4 rounded-xl shadow-lg max-w-sm">
        <h4 className="font-bold text-ink-dark text-sm mb-3 border-b border-ink-dark/10 pb-2">
          {label}
        </h4>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="flex justify-between gap-4 text-sm"
              style={{ color: entry.color }}
            >
              <span>{entry.name}:</span>
              <span className="font-bold">{entry.value}/10</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/**
 *
 */
export const BlueOceanValueCurve: React.FC = () => {
  const fetchState = useMarketIntelligence<ValueFactor>("market_value_factors");

  const data = useMemo(() => {
    if (fetchState.status !== "success") return [];
    return fetchState.data.map((item) => {
      const point: any = {
        name: item.name,
        "Our Product": item.userProductScore,
      };
      // Map competitor scores
      Object.entries(item.competitorScores).forEach(([compId, score]) => {
        point[compId] = score; // Normally we'd join with demoCompetitors to get real names
      });
      return point;
    });
  }, [fetchState]);

  if (fetchState.status === "loading" || fetchState.status === "idle") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-[400px]">
        <Loader2 className="animate-spin w-8 h-8 text-ink-dark/60 mb-2" />
        <p className="text-sm text-ink-dark/60 font-serif">Loading Blue Ocean factors...</p>
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border border-rose-200 rounded-xl shadow-sm p-8 min-h-[400px]">
        <div className="text-rose-600 font-bold">Failed to load Value Factors</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold font-serif text-ink-dark mb-2">
          Algorithmic Blue Ocean Value Curve
        </h3>
        <p className="text-sm text-ink-dark/70">
          Carve out an entirely new market space where competition is
          irrelevant. Visually differentiate your product's specific value
          proposition from the crowded features of incumbents.
        </p>
      </div>

      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              label={{
                value: "Offering Level",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Our Product"
              stroke="#10b981"
              strokeWidth={4}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="comp-1"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="TechFlow"
            />
            <Line
              type="monotone"
              dataKey="comp-2"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="AutoScale"
            />
            <Line
              type="monotone"
              dataKey="comp-3"
              stroke="#4b5563"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="DataSync"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
