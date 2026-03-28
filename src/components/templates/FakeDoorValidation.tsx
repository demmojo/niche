import React from "react";
import { B_H2, B_Badge, B_TextBody, B_Card } from "../BrutalistUI";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const funnelData = [
  { step: "/pricing (View)", users: 12054, drop: 12054 },
  { step: 'Clicked "Pro"', users: 3042, drop: 3042 },
  { step: "Auth Wall", users: 843, drop: 843 },
  { step: "Waitlist Form", users: 211, drop: 211 },
];

/**
 *
 */
export function FakeDoorValidation() {
  const viewsKey: keyof (typeof funnelData)[0] = "users";

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0F172A] text-white font-mono">
      <div className="mb-8 border-b-2 border-slate-700 pb-4">
        <B_Badge variant="success" className="mb-2">
          GTM VALIDATION
        </B_Badge>
        <B_H2>FAKE DOOR FUNNEL</B_H2>
        <B_TextBody className="text-sm mt-2 text-slate-400">
          Track conversion intent from impressions to waitlist opt-ins.
        </B_TextBody>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <B_Card className="border-4 border-[var(--color-brutal-cyan)] bg-black shadow-[6px_6px_0px_0px_var(--color-brutal-cyan)] p-6 rounded-none">
          <div className="text-sm font-bold uppercase tracking-tight mb-2">
            Intent CTR
          </div>
          <div className="text-4xl font-black text-white">25.2%</div>
          <div className="mt-4 text-[var(--color-brutal-chartreuse)] bg-black border-2 border-[var(--color-brutal-chartreuse)] px-2 py-1 text-xs font-bold inline-block shadow-[2px_2px_0px_0px_var(--color-brutal-chartreuse)]">
            [STATUS: VALIDATED]
          </div>
        </B_Card>

        <B_Card className="border-4 border-slate-700 bg-slate-900 p-6 rounded-none shadow-[6px_6px_0px_0px_#334155]">
          <div className="text-sm font-bold uppercase tracking-tight mb-2 text-slate-400">
            Waitlist Capture Rate
          </div>
          <div className="text-4xl font-black text-white">6.9%</div>
        </B_Card>

        <B_Card className="border-4 border-[var(--color-brutal-red)] bg-black p-6 rounded-none shadow-[6px_6px_0px_0px_var(--color-brutal-red)]">
          <div className="text-sm font-bold uppercase tracking-tight mb-2 text-[var(--color-brutal-red)]">
            Frustration Bounce
          </div>
          <div className="text-4xl font-black text-white">72.3%</div>
          <div className="mt-4 text-[var(--color-brutal-red)] text-xs font-bold">
            Immediate exit post-click
          </div>
        </B_Card>
      </div>

      <div className="border-4 border-black p-6 bg-[#1E293B] shadow-[8px_8px_0px_0px_#000000]">
        <h2 className="uppercase border-b-4 border-black pb-2 mb-8 text-xl font-bold tracking-tight text-white">
          CONVERSION DROP-OFF
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              layout="vertical"
              data={funnelData}
              margin={{ top: 0, right: 20, bottom: 0, left: 40 }}
            >
              <CartesianGrid
                stroke="#000"
                strokeWidth={2}
                strokeDasharray="none"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#fff"
                tick={{ fill: "#fff", fontSize: 12, fontFamily: "monospace" }}
              />
              <YAxis
                dataKey="step"
                type="category"
                stroke="#fff"
                tick={{ fill: "#fff", fontSize: 12, fontFamily: "monospace" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  border: "2px solid #00F0FF",
                  fontFamily: "monospace",
                }}
                itemStyle={{ color: "#fff" }}
              />

              {/* The Bars: Raw, bordered, no radius */}
              <Bar
                dataKey={viewsKey}
                barSize={40}
                fill="var(--color-brutal-cyan)"
                stroke="#000000"
                strokeWidth={4}
              />

              {/* The harsh drop-off line overlay */}
              <Line
                dataKey="drop"
                type="stepAfter"
                stroke="var(--color-brutal-red)"
                strokeWidth={4}
                dot={{
                  r: 6,
                  fill: "var(--color-brutal-red)",
                  stroke: "#000",
                  strokeWidth: 3,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
