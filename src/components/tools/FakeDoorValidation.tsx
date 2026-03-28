import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { demoValidationCampaigns } from "../../utils/demoMockData";
import { ValidationCampaign } from "../../types";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: ValidationCampaign = payload[0].payload;
    return (
      <div className="bg-white border border-ink-dark/20 p-4 rounded-xl shadow-lg max-w-sm">
        <h4 className="font-bold text-ink-dark text-sm mb-3">{data.name}</h4>

        <div className="space-y-1 text-sm text-ink-dark/80 mb-3 border-b border-ink-dark/10 pb-3">
          <div className="flex justify-between">
            <span>Ad Impressions:</span>
            <span className="font-medium">
              {data.adImpressions.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>CTA Clicks:</span>
            <span className="font-medium">
              {data.ctaClicks.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Email Captures:</span>
            <span className="font-medium">
              {data.emailCaptures.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Purchase Intent:</span>
            <span className="font-medium">
              {data.purchaseIntent.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-ink-dark/70">
          <div className="font-bold text-rose-500">
            CPAi: ${data.calculatedCPAi.toFixed(2)}
          </div>
          <div className="font-bold text-emerald-500 text-right">
            Validation: {data.skinInTheGameScore}/100
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const FakeDoorValidation: React.FC = () => {
  const data = useMemo(() => {
    return demoValidationCampaigns.map((item) => ({
      name: item.name,
      Impressions: item.adImpressions,
      Clicks: item.ctaClicks,
      Emails: item.emailCaptures,
      Intent: item.purchaseIntent,
      ...item,
    }));
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold font-serif text-ink-dark mb-2">
          Pretotyping (Fake Door) Validation
        </h3>
        <p className="text-sm text-ink-dark/70">
          Prove that people will actually pay for your idea before you build it.
          Track real purchase intent (clicks, signups, waitlist joins) to
          guarantee market demand.
        </p>
      </div>

      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e5e5"
              horizontal={false}
            />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />
            <Legend />
            {/* The scale differences are huge, so a log scale or stacked might be better in prod,
                but keeping it simple for the demo. */}
            <Bar
              dataKey="Clicks"
              stackId="a"
              fill="#0ea5e9"
              name="CTA Clicks"
            />
            <Bar
              dataKey="Emails"
              stackId="a"
              fill="#10b981"
              name="Email Captures"
            />
            <Bar
              dataKey="Intent"
              stackId="a"
              fill="#f59e0b"
              name="Purchase Intent"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
