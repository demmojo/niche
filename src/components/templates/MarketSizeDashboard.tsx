import React, { useState, useMemo } from "react";
import {
  B_H1,
  B_H2,
  B_H3,
  B_TextBody,
  B_Card,
  B_Badge,
  B_Button,
  B_TextData,
} from "../BrutalistUI";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface PresentationViewerProps {
  templateId: string;
}

// LTTB (Largest Triangle Three Buckets) Downsampling algorithm
/**
 *
 */
function downsample(data: any[], threshold: number) {
  if (!data || data.length <= threshold) return data;

  const dataLength = data.length;
  const bucketSize = (dataLength - 2) / (threshold - 2);
  const sampledData = [];

  // Always include the first point
  sampledData.push(data[0]);

  let a = 0; // Current index

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate average point for the next bucket
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += avgRangeStart;
      avgY += data[avgRangeStart].value; // Assuming 'value' is the metric to chart
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Find the point in the current bucket that forms the largest triangle
    let rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;
    let maxArea = -1;
    let maxAreaIndex = -1;

    for (; rangeStart < rangeEnd; rangeStart++) {
      const pointAx = a;
      const pointAy = data[a].value;

      const pointBx = rangeStart;
      const pointBy = data[rangeStart].value;

      const pointCx = avgX;
      const pointCy = avgY;

      // Calculate area of triangle
      const area = Math.abs(
        (pointAx * (pointBy - pointCy) +
          pointBx * (pointCy - pointAy) +
          pointCx * (pointAy - pointBy)) /
          2,
      );

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = rangeStart;
      }
    }

    sampledData.push(data[maxAreaIndex]);
    a = maxAreaIndex;
  }

  // Always include the last point
  sampledData.push(data[dataLength - 1]);

  return sampledData;
}

// Mock Data
/**
 *
 */
const generateMockData = (points: number) => {
  return Array.from({ length: points }).map((_, i) => {
    return {
      name: `T-${points - i}`,
      value: Math.floor(Math.random() * 5000) + 1000 + i * 10,
      volume: Math.floor(Math.random() * 1000) + 200,
    };
  });
};

/**
 *
 */
export default function MarketSizeDashboard({
  templateId,
}: PresentationViewerProps) {
  const [timeframe, setTimeframe] = useState<"q1" | "q2" | "ytd">("q1");
  const [modalData, setModalData] = useState<any>(null);

  // Use heavy data to test downsampling
  const rawData = useMemo(() => generateMockData(1500), [timeframe]);
  // Downsample to 100 points to prevent DOM explosion
  const chartData = useMemo(() => downsample(rawData, 100), [rawData]);

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header & Macro Toggles */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-slate-700 pb-4">
        <div>
          <B_Badge variant="info" className="mb-2">
            MARKET SIZE BY COMPETITOR
          </B_Badge>
          <B_H1>Q1 MARKET SHARE</B_H1>
        </div>
        <div className="flex gap-2">
          <B_Button
            variant={timeframe === "q1" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTimeframe("q1")}
          >
            Q1
          </B_Button>
          <B_Button
            variant={timeframe === "q2" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTimeframe("q2")}
          >
            Q2
          </B_Button>
          <B_Button
            variant={timeframe === "ytd" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTimeframe("ytd")}
          >
            YTD
          </B_Button>
        </div>
      </div>

      {/* F-Pattern KPI Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <B_Card
          glow
          className="cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() =>
            setModalData({
              title: "Total Addressable Market",
              detail: "$45B projected growth",
            })
          }
        >
          <B_TextData className="mb-1">
            TAM (Total Addressable Market)
          </B_TextData>
          <div className="text-4xl font-display font-bold text-[var(--color-brutal-cyan)]">
            $45.2B
          </div>
          <div className="text-sm font-mono text-[var(--color-brutal-chartreuse)] mt-2">
            ↑ 12% YoY
          </div>
        </B_Card>

        <B_Card
          className="cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() =>
            setModalData({
              title: "Serviceable Obtainable Market",
              detail: "$12B active scope",
            })
          }
        >
          <B_TextData className="mb-1">
            SOM (Serviceable Obtainable Market)
          </B_TextData>
          <div className="text-4xl font-display font-bold text-white">
            $12.4B
          </div>
          <div className="text-sm font-mono text-[var(--color-brutal-chartreuse)] mt-2">
            ↑ 5% YoY
          </div>
        </B_Card>

        <B_Card
          className="cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() =>
            setModalData({
              title: "Our Market Share",
              detail: "Holding steady at 8.4%",
            })
          }
        >
          <B_TextData className="mb-1">Our Share</B_TextData>
          <div className="text-4xl font-display font-bold text-white">8.4%</div>
          <div className="text-sm font-mono text-slate-400 mt-2">- Flat</div>
        </B_Card>

        <B_Card
          className="cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() =>
            setModalData({
              title: "Primary Threat",
              detail: "Competitor X launched new tier",
            })
          }
        >
          <B_TextData className="mb-1">Threat Level</B_TextData>
          <div className="text-4xl font-display font-bold text-[var(--color-brutal-red)]">
            HIGH
          </div>
          <div className="text-sm font-mono text-[var(--color-brutal-red)] mt-2">
            Competitor X surging
          </div>
        </B_Card>
      </div>

      {/* Main Chart area */}
      <B_Card className="mb-8 p-0 overflow-hidden">
        <div className="p-6 border-b-2 border-slate-700 bg-slate-800">
          <B_H2>MARKET GROWTH TREND</B_H2>
          <B_TextBody className="text-sm">
            Downsampled from 1,500 data points for performance rendering.
          </B_TextBody>
        </div>
        <div className="h-[400px] w-full p-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-brutal-cyan)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-brutal-cyan)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 12 }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  border: "2px solid #00F0FF",
                  borderRadius: 0,
                  fontFamily: "JetBrains Mono",
                }}
                itemStyle={{ color: "#00F0FF" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-brutal-cyan)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </B_Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <B_Card className="p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-slate-700 bg-slate-800">
            <B_H3>COMPETITOR VOLUME</B_H3>
          </div>
          <div className="h-[250px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 20)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
                <RechartsTooltip
                  cursor={{ fill: "#1E293B" }}
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "2px solid #D9F99D",
                    borderRadius: 0,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <Bar dataKey="volume" fill="var(--color-brutal-chartreuse)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </B_Card>

        <B_Card>
          <B_H3 className="mb-4">AI SYNTHESIS</B_H3>
          <div className="font-sans text-lg text-slate-300 space-y-4">
            <p>
              <strong className="text-white">Trend:</strong> The market shows
              consistent growth, but Competitor X's volume is increasing
              disproportionately.
            </p>
            <p>
              <strong className="text-[var(--color-brutal-cyan)]">
                Action:
              </strong>{" "}
              Investigate their recent feature launch targeting Enterprise
              segments.
            </p>
          </div>
        </B_Card>
      </div>

      {/* KPI Drill-Down Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <B_Card
            glow
            className="w-full max-w-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start mb-6">
              <B_H2>{modalData.title}</B_H2>
              <button
                onClick={() => setModalData(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <B_TextBody className="mb-6">{modalData.detail}</B_TextBody>

            <div className="bg-slate-900 p-4 border border-slate-700 mb-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.slice(0, 30)}>
                  <Area
                    type="step"
                    dataKey="value"
                    stroke="var(--color-brutal-chartreuse)"
                    fill="none"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-end gap-4">
              <B_Button variant="outline" onClick={() => setModalData(null)}>
                CLOSE
              </B_Button>
              <B_Button variant="primary">EXPORT REPORT</B_Button>
            </div>
          </B_Card>
        </div>
      )}
    </div>
  );
}
