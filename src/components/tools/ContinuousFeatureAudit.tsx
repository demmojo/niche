import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { Activity, AlertTriangle, ArrowUpRight, Target } from "lucide-react";

// Mock DeploymentAnalytics data
const mockAuditData = [
  { date: "Day 1", users: 120, conversion: 2.5, bounce: 65 },
  { date: "Day 2", users: 340, conversion: 3.2, bounce: 60 },
  { date: "Day 3", users: 510, conversion: 4.8, bounce: 55 },
  { date: "Day 4", users: 890, conversion: 5.1, bounce: 50 },
  { date: "Day 5", users: 1250, conversion: 6.4, bounce: 42 },
  { date: "Day 6", users: 1420, conversion: 7.2, bounce: 38 },
  { date: "Day 7", users: 1850, conversion: 8.5, bounce: 35 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-ink-dark/20 p-4 rounded-xl shadow-lg min-w-[200px]">
        <h4 className="font-bold text-ink-dark text-sm mb-3 border-b border-ink-dark/10 pb-2">
          {label}
        </h4>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-ink-dark/70 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.name === "Adoption" || entry.name === "Bounce Rate"
                  ? `${entry.value}%`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ContinuousFeatureAudit: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold font-serif text-ink-dark mb-2 flex items-center gap-2">
            <Activity className="text-sky" />
            Live Feature Audit
          </h3>
          <p className="text-sm text-ink-dark/70 max-w-2xl">
            Real-time telemetry aggregated from your deployed Cloudflare Pages
            experiments. Compare adoption rates against your initial
            JTBD/Assumption hypotheses.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider">
              Hypothesis Status
            </span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle size={14} /> Validated
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-ink-dark/10 rounded-xl bg-paper-base">
          <div className="text-xs text-ink-dark/60 font-bold uppercase tracking-wider mb-1">
            Total Users (7d)
          </div>
          <div className="text-2xl font-bold text-ink-dark flex items-baseline gap-2">
            1,850
            <span className="text-xs text-emerald-500 font-medium flex items-center">
              <ArrowUpRight size={12} /> +24%
            </span>
          </div>
        </div>
        <div className="p-4 border border-ink-dark/10 rounded-xl bg-paper-base">
          <div className="text-xs text-ink-dark/60 font-bold uppercase tracking-wider mb-1">
            Avg. Conversion
          </div>
          <div className="text-2xl font-bold text-sky flex items-baseline gap-2">
            8.5%
            <span className="text-xs text-emerald-500 font-medium flex items-center">
              <ArrowUpRight size={12} /> +1.2%
            </span>
          </div>
        </div>
        <div className="p-4 border border-ink-dark/10 rounded-xl bg-paper-base">
          <div className="text-xs text-ink-dark/60 font-bold uppercase tracking-wider mb-1">
            Bounce Rate
          </div>
          <div className="text-2xl font-bold text-rose-500 flex items-baseline gap-2">
            35%
            <span className="text-xs text-emerald-500 font-medium flex items-center">
              <ArrowUpRight size={12} className="rotate-90" /> -5%
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mockAuditData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e5e5"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="users"
              name="Active Users"
              fill="#bae6fd"
              stroke="#0ea5e9"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="conversion"
              name="Adoption"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bounce"
              name="Bounce Rate"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
