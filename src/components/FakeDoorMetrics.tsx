import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Eye,
  Target,
  MousePointerClick,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface FakeDoorMetricsProps {
  siteToken?: string;
}

export const FakeDoorMetrics: React.FC<FakeDoorMetricsProps> = ({
  siteToken,
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cloudflare/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteToken }),
      });
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError("Failed to fetch metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [siteToken]);

  // Mock timeseries data for the chart
  const data = [
    { name: "Mon", views: 400, clicks: 24 },
    { name: "Tue", views: 300, clicks: 13 },
    { name: "Wed", views: 550, clicks: 45 },
    { name: "Thu", views: 700, clicks: 80 },
    { name: "Fri", views: 1250, clicks: 120 },
  ];

  if (isLoading && !metrics) {
    return (
      <div className="h-64 flex items-center justify-center border border-ink-dark/20 rounded-xl bg-paper-base animate-pulse">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-red-200 rounded-xl bg-red-50 text-red-700">
        <AlertCircle size={32} className="mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics || metrics.pageViews === 0) {
    return (
      <div className="bg-paper-card border border-ink-dark/20 p-12 rounded-xl flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-48 h-48 border border-sky/30 rounded-full animate-[ping_3s_ease-out_infinite]" />
          <div className="absolute w-32 h-32 border border-sky/40 rounded-full animate-[ping_3s_ease-out_infinite_1s]" />
          <div className="absolute w-16 h-16 border border-sky/50 rounded-full animate-[ping_3s_ease-out_infinite_2s]" />
          <Eye size={32} className="text-sky relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-ink-dark">
          Awaiting Initial Traffic
        </h3>
        <p className="text-sm text-ink-muted max-w-md mt-2">
          Cloudflare Web Analytics is provisioned and listening. Send traffic to
          your deployment URL to populate this dashboard.
        </p>
        <button
          onClick={fetchMetrics}
          className="mt-6 flex items-center gap-2 px-4 py-2 border border-ink-dark/20 rounded-lg hover:bg-paper-base transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} /> Force Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-ink-dark flex items-center gap-2">
          <Target className="text-emerald-500" size={24} /> Fake Door Validation
          Metrics
        </h3>
        <button
          onClick={fetchMetrics}
          className="p-2 text-ink-muted hover:text-ink-dark transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-ink-muted mb-2">
            <Eye size={16} /> Page Views
          </div>
          <div className="text-3xl font-bold text-ink-dark">
            {metrics.pageViews.toLocaleString()}
          </div>
        </div>
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-ink-muted mb-2">
            <Users size={16} /> Unique Visitors
          </div>
          <div className="text-3xl font-bold text-ink-dark">
            {metrics.uniqueVisitors.toLocaleString()}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-emerald-800 mb-2">
            <MousePointerClick size={16} /> Conversion Rate
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {metrics.conversionRate}
          </div>
          <p className="text-xs text-emerald-700/70 mt-1">
            Visitor-to-Lead Intent
          </p>
        </div>
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 overflow-hidden">
          <div className="flex items-center gap-2 text-ink-muted mb-2">
            Top Referrers
          </div>
          <div className="text-sm font-medium text-ink-dark truncate">
            {metrics.referrers[0]}
          </div>
          <div className="text-sm font-medium text-ink-dark truncate mt-1">
            {metrics.referrers[1]}
          </div>
        </div>
      </div>

      <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 h-80">
        <h4 className="font-bold text-ink-dark mb-4 text-sm">
          Conversion Intent over Time
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#8A8A8A"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8A8A8A"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E5E5"
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E5E5",
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorViews)"
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorClicks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
