import React from "react";
import { B_H2, B_Badge, B_TextBody, B_Card } from "../BrutalistUI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const valueCurveData = [
  { factor: "Price", "Competitor X": 5, "Competitor Y": 3, "Our Product": 1 },
  {
    factor: "Implementation Speed",
    "Competitor X": 2,
    "Competitor Y": 4,
    "Our Product": 5,
  },
  {
    factor: "Customization",
    "Competitor X": 5,
    "Competitor Y": 3,
    "Our Product": 2,
  },
  {
    factor: "AI Automation",
    "Competitor X": 1,
    "Competitor Y": 1,
    "Our Product": 5,
  },
  {
    factor: "Security",
    "Competitor X": 4,
    "Competitor Y": 5,
    "Our Product": 4,
  },
];

/**
 *
 */
export function BlueOceanValueCurve() {
  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0F172A] text-white font-mono">
      <div className="mb-8 border-b-2 border-slate-700 pb-4">
        <B_Badge variant="success" className="mb-2">
          MARKET STRATEGY
        </B_Badge>
        <B_H2>BLUE OCEAN VALUE CURVE</B_H2>
        <B_TextBody className="text-sm mt-2 text-slate-400">
          Visualize where competitors over-invest and spot uncontested market
          space. Powered by Competitor.coreFeatures.
        </B_TextBody>
      </div>

      <div className="border-4 border-black p-6 bg-[#1E293B] shadow-[8px_8px_0px_0px_#000000]">
        <h2 className="uppercase border-b-4 border-black pb-2 mb-8 text-xl font-bold tracking-tight text-white">
          VALUE FACTOR INVESTMENT
        </h2>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={valueCurveData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis
                dataKey="factor"
                stroke="#fff"
                tick={{ fill: "#fff", fontSize: 12, fontFamily: "monospace" }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                stroke="#fff"
                tick={{ fill: "#fff", fontSize: 12, fontFamily: "monospace" }}
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  border: "2px solid #fff",
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="Competitor X"
                stroke="var(--color-brutal-red)"
                strokeWidth={3}
                dot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Competitor Y"
                stroke="#94A3B8"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Our Product"
                stroke="var(--color-brutal-cyan)"
                strokeWidth={5}
                dot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
