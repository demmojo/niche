import React, { useState } from "react";
import {
  Search,
  Map,
  Layout,
  Zap,
  Flame,
  Briefcase,
  ChevronRight,
  Activity,
} from "lucide-react";
import { ToolboxEngine } from "./ToolboxEngine";

const TOOLS = [
  {
    id: "competitor-feature-gap",
    title: "Competitor Feature Gap & Sentiment Matrix",
    description:
      "Discover where competitors are failing. See exactly which features users hate so you can build a better alternative.",
    icon: <Map className="w-8 h-8 text-sky" />,
    badge: "Early-Stage",
    dataLineage: "Exa API (Sentiment)",
  },
  {
    id: "jtbd-opportunity",
    title: "JTBD Opportunity Landscape",
    description:
      "Find the most underserved customer needs. Stop guessing what users want and focus on high-impact 'Jobs to be Done'.",
    icon: <Briefcase className="w-8 h-8 text-indigo-500" />,
    badge: "Pre-PMF",
    dataLineage: "Exa API (Intent)",
  },
  {
    id: "assumption-mapping",
    title: "Assumption Mapping (RAT)",
    description:
      "Identify assumptions that could kill your business. Focus your validation efforts on the highest-risk, unproven hypotheses.",
    icon: <Layout className="w-8 h-8 text-rose-500" />,
    badge: "High-Risk",
    dataLineage: "Local MyProductData",
  },
  {
    id: "fake-door-validation",
    title: "Pretotyping Validation Dashboard",
    description:
      "Prove market demand before writing code. Track real purchase intent (clicks, signups) to guarantee your idea has legs.",
    icon: <Flame className="w-8 h-8 text-orange-500" />,
    badge: "Validation",
    dataLineage: "Validation Campaigns",
  },
  {
    id: "blue-ocean-curve",
    title: "Algorithmic Blue Ocean Value Curve",
    description:
      "Carve out uncontested market space. Visually differentiate your product's value proposition from crowded incumbents.",
    icon: <Zap className="w-8 h-8 text-emerald-500" />,
    badge: "Strategic",
    dataLineage: "Apollo.io Firmographics",
  },
  {
    id: "continuous-feature-audit",
    title: "Continuous Feature Audit",
    description:
      "Monitor real-world feature adoption. Know instantly if your deployed features are actually being used by customers.",
    icon: <Activity className="w-8 h-8 text-indigo-400" />,
    badge: "Post-Launch",
    dataLineage: "Cloudflare Analytics",
  },
];

/**
 *
 */
export function StrategyToolbox() {
  const [activeTool, setActiveTool] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (activeTool) {
    return (
      <ToolboxEngine
        key={activeTool.id}
        toolId={activeTool.id}
        toolName={activeTool.title}
        onClose={() => setActiveTool(null)}
      />
    );
  }

  const filteredTools = TOOLS.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full overflow-y-auto p-6 bg-paper-base">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end mb-8 mt-4">
          <div>
            <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
              ツールボックス
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
              Strategy Toolbox
            </h1>
            <p className="text-[#8A8A8A] text-sm font-sans mt-2">
              Select a data-driven tool to de-risk your early-stage product.
            </p>
          </div>
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dark/40"
            />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-ink-dark/20 rounded-lg text-sm text-ink-dark focus:outline-none focus:border-ink-dark/40 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool({ id: tool.id, title: tool.title })}
              className="group text-left p-6 bg-white border border-ink-dark/10 rounded-2xl shadow-sm hover:shadow-md hover:border-ink-dark/30 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50 transition-opacity group-hover:opacity-100 group-hover:translate-x-1 duration-300">
                <ChevronRight
                  size={24}
                  className="text-ink-dark/40 group-hover:text-ink-dark"
                />
              </div>

              <div className="mb-6 p-4 bg-paper-base rounded-xl inline-flex w-fit">
                {tool.icon}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xl font-bold font-serif text-ink-dark">
                  {tool.title}
                </h2>
              </div>

              <p className="text-ink-dark/70 text-sm leading-relaxed mb-6 flex-1">
                {tool.description}
              </p>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-ink-dark/5 w-full">
                <span className="px-2 py-1 bg-ink-dark/5 text-ink-dark/70 text-xs font-semibold rounded uppercase tracking-wider">
                  {tool.badge}
                </span>
                <span className="text-xs text-ink-dark/50 flex items-center gap-1">
                  <DatabaseIcon size={12} />
                  {tool.dataLineage}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 *
 */
function DatabaseIcon(props: any) {
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
