import React from "react";
import {
  BarChart as BarChartIcon,
  Users,
  Lightbulb,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Mock data for the dashboard
const KPI_DATA = {
  totalWorkspaces: 142,
  activeCompetitorsTracked: 843,
  insightsGenerated: 12540,
  systemErrorRate: 1.2,
};

const CHART_COLORS = ["#C16E5A", "#4A7A64", "#D4B872", "#2C2C2C", "#8A8A8A"];

const ENGAGEMENT_DATA = [
  { name: "Mon", searches: 400, syncs: 240 },
  { name: "Tue", searches: 300, syncs: 139 },
  { name: "Wed", searches: 520, syncs: 380 },
  { name: "Thu", searches: 450, syncs: 290 },
  { name: "Fri", searches: 600, syncs: 420 },
  { name: "Sat", searches: 200, syncs: 150 },
  { name: "Sun", searches: 250, syncs: 180 },
];

const INSIGHTS_DISTRIBUTION = [
  { name: "Threats", value: 45 },
  { name: "Opportunities", value: 35 },
  { name: "Trends", value: 20 },
];

const SOURCE_COVERAGE = [
  { name: "Website Scraping", value: 65 },
  { name: "News & PR", value: 20 },
  { name: "API (Apollo/Exa)", value: 15 },
];

export function SuperadminAnalytics({
  isSuperadmin,
}: {
  isSuperadmin: boolean;
}) {
  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center text-ink-dark/60">
        <AlertTriangle size={32} className="mb-4 text-accent-coral mx-auto" />
        <p>Access Denied. You must be a superadmin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-ink-dark tracking-tight mb-2 flex items-center gap-3">
          <BarChartIcon className="text-moss" size={32} />
          Platform Analytics
        </h1>
        <p className="text-ink-dark/60">
          Key Performance Indicators for the Competitive Intelligence platform.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-ink-dark/60">
            <Users size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Total Workspaces
            </span>
          </div>
          <div className="text-3xl font-bold text-ink-dark">
            {KPI_DATA.totalWorkspaces}
          </div>
          <div className="text-xs text-moss font-medium mt-2">
            +12% from last month
          </div>
        </div>

        <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-ink-dark/60">
            <BarChartIcon size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Competitors Tracked
            </span>
          </div>
          <div className="text-3xl font-bold text-ink-dark">
            {KPI_DATA.activeCompetitorsTracked}
          </div>
          <div className="text-xs text-moss font-medium mt-2">
            +5% from last month
          </div>
        </div>

        <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-ink-dark/60">
            <Lightbulb size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Insights Generated
            </span>
          </div>
          <div className="text-3xl font-bold text-ink-dark">
            {(KPI_DATA.insightsGenerated / 1000).toFixed(1)}k
          </div>
          <div className="text-xs text-moss font-medium mt-2">
            +24% from last month
          </div>
        </div>

        <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-ink-dark/60">
            <Activity size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              System Error Rate
            </span>
          </div>
          <div className="text-3xl font-bold text-ink-dark">
            {KPI_DATA.systemErrorRate}%
          </div>
          <div className="text-xs text-moss font-medium mt-2">
            -0.3% from last month
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Engagement Line Chart */}
        <div className="bg-paper-card border border-ink-dark/10 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-ink-dark mb-6">
            Daily Activity (7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={ENGAGEMENT_DATA}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorSearches"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[0]}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[0]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorSyncs" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[1]}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[1]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E5E5"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8A8A8A", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8A8A8A", fontSize: 12 }}
                  dx={-10}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#FCFBFA",
                    borderRadius: "8px",
                    border: "1px solid #E5E5E5",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#2C2C2C", fontWeight: 500 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Area
                  type="monotone"
                  dataKey="searches"
                  name="Searches & Queries"
                  stroke={CHART_COLORS[0]}
                  fillOpacity={1}
                  fill="url(#colorSearches)"
                />
                <Area
                  type="monotone"
                  dataKey="syncs"
                  name="Data Syncs"
                  stroke={CHART_COLORS[1]}
                  fillOpacity={1}
                  fill="url(#colorSyncs)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Donut Chart */}
        <div className="bg-paper-card border border-ink-dark/10 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-ink-dark mb-6">
            Insights Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={INSIGHTS_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {INSIGHTS_DISTRIBUTION.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#FCFBFA",
                    borderRadius: "8px",
                    border: "1px solid #E5E5E5",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#2C2C2C", fontWeight: 500 }}
                />
                <Legend
                  iconType="circle"
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Coverage Bar Chart */}
        <div className="bg-paper-card border border-ink-dark/10 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-ink-dark mb-6">
            Data Source Utilization
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={SOURCE_COVERAGE}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E5E5E5"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8A8A8A", fontSize: 12 }}
                  dx={10}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#2C2C2C", fontSize: 12, fontWeight: 500 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#FCFBFA",
                    borderRadius: "8px",
                    border: "1px solid #E5E5E5",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.02)" }}
                />
                <Bar
                  dataKey="value"
                  name="Percentage (%)"
                  fill={CHART_COLORS[2]}
                  radius={[0, 4, 4, 0]}
                >
                  {SOURCE_COVERAGE.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
