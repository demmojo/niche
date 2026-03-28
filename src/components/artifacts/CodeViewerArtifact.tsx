import React, { useState } from "react";
import {
  GitBranch,
  Clock,
  Play,
  Code2,
  AlertTriangle,
  CheckCircle,
  Save,
  GitMerge,
} from "lucide-react";
import { ExperimentVersion } from "../../types";

interface CodeViewerArtifactProps {
  acceptedFeatures: any[];
  onDeploy?: () => void;
}

export default function CodeViewerArtifact({
  acceptedFeatures,
  onDeploy,
}: CodeViewerArtifactProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState("v1.0.0-draft");

  // Mock versions
  const versions: Partial<ExperimentVersion>[] = [
    {
      id: "v1",
      versionName: "v1.0.0-draft",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "v2",
      versionName: "v1.1.0-darkmode",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  // Mock code generation lines. In reality, these would come from an LLM.
  const lines = [
    {
      num: 1,
      code: "import { createClient } from '@supabase/supabase-js';",
      featureId: null,
    },
    {
      num: 2,
      code: "import { Button, Card } from '@/components/ui';",
      featureId: null,
    },
    { num: 3, code: "", featureId: null },
    { num: 4, code: "export default function Dashboard() {", featureId: null },
    {
      num: 5,
      code: "  const [data, setData] = useState([]);",
      featureId: null,
    },
    { num: 6, code: "", featureId: null },
    { num: 7, code: "  // Core Feature Implementation", featureId: null },
    {
      num: 8,
      code: "  const handleAutomatedDispatch = async () => {",
      featureId: "f1",
    },
    {
      num: 9,
      code: "    await dispatchPlumber({ geo: location });",
      featureId: "f1",
    },
    { num: 10, code: "  };", featureId: "f1" },
    { num: 11, code: "", featureId: null },
    { num: 12, code: "  return (", featureId: null },
    { num: 13, code: "    <div className='p-8'>", featureId: null },
    {
      num: 14,
      code: "      <h1 className='text-2xl font-bold'>Niche App</h1>",
      featureId: null,
    },
    { num: 15, code: "      <Card className='p-4'>", featureId: null },
    {
      num: 16,
      code: "        <Button onClick={handleAutomatedDispatch}>",
      featureId: "f1",
    },
    { num: 17, code: "          Dispatch Plumber", featureId: "f1" },
    { num: 18, code: "        </Button>", featureId: "f1" },
    { num: 19, code: "      </Card>", featureId: null },
    { num: 20, code: "    </div>", featureId: null },
    { num: 21, code: "  );", featureId: null },
    { num: 22, code: "}", featureId: null },
  ];

  return (
    <div className="flex h-full w-full bg-paper-base font-mono text-sm overflow-hidden border border-ink-dark/10 rounded-xl shadow-sm">
      {/* Version Control Panel (Left Sidebar) */}
      <div
        className={`border-r border-ink-dark/10 bg-white flex flex-col transition-all duration-300 ${isVersionPanelOpen ? "w-64" : "w-16"}`}
      >
        <div className="p-4 border-b border-ink-dark/10 flex items-center justify-between shrink-0">
          {isVersionPanelOpen && (
            <span className="font-bold text-ink-dark flex items-center gap-2">
              <GitBranch size={16} /> Versions
            </span>
          )}
          <button
            onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
            className="p-1 hover:bg-paper-base rounded text-ink-dark/60 transition-colors mx-auto"
          >
            <GitMerge
              size={20}
              className={isVersionPanelOpen ? "rotate-180" : ""}
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {versions.map((v) => (
            <div
              key={v.id}
              onClick={() => {
                if (!isVersionPanelOpen) setIsVersionPanelOpen(true);
                setActiveVersion(v.versionName!);
              }}
              className={`px-4 py-3 cursor-pointer border-l-4 transition-colors flex items-center gap-3 ${
                activeVersion === v.versionName
                  ? "border-sky bg-sky/5"
                  : "border-transparent hover:bg-paper-base"
              }`}
            >
              <div
                className={`shrink-0 ${activeVersion === v.versionName ? "text-sky" : "text-ink-dark/40"}`}
              >
                <Save size={16} />
              </div>
              {isVersionPanelOpen && (
                <div className="overflow-hidden">
                  <div
                    className={`font-semibold truncate text-xs ${activeVersion === v.versionName ? "text-sky" : "text-ink-dark"}`}
                  >
                    {v.versionName}
                  </div>
                  <div className="text-[10px] text-ink-dark/50 flex items-center gap-1 mt-1">
                    <Clock size={10} />
                    {new Date(v.timestamp!).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {isVersionPanelOpen && (
          <div className="p-4 border-t border-ink-dark/10 mt-auto bg-paper-base/50">
            <p className="text-[10px] text-ink-dark/60 leading-tight">
              Pin experiments as distinct versions to A/B test deployments via
              Cloudflare Pages.
            </p>
          </div>
        )}
      </div>

      {/* Features & Code Viewer (Right/Main Area) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="bg-white border-b border-ink-dark/10 p-3 z-10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Code2 size={18} className="text-sky" />
            <span className="text-ink-dark font-bold tracking-widest text-xs">
              pages/index.tsx
            </span>
            <span className="px-2 py-0.5 bg-ink-dark/5 text-ink-dark/60 text-[10px] rounded uppercase font-bold tracking-wider">
              {activeVersion}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-sky/10 text-sky text-[10px] font-bold rounded uppercase">
              REACT / NEXT.JS
            </span>
            <button
              onClick={onDeploy}
              className="flex items-center gap-2 px-4 py-1.5 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Play size={14} fill="currentColor" />
              Deploy to Edge
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Active Features List */}
          <div className="w-48 border-r border-ink-dark/10 bg-paper-base/30 p-3 overflow-y-auto shrink-0">
            <div className="text-[10px] font-bold text-ink-dark/50 uppercase tracking-wider mb-3">
              Included Specs
            </div>
            <div className="space-y-2">
              {acceptedFeatures.length === 0 && (
                <div className="text-ink-dark/40 text-xs italic">
                  [ No specs selected ]
                </div>
              )}
              {acceptedFeatures.map((feat) => (
                <div
                  key={feat.id}
                  onMouseEnter={() => setHoveredFeature(feat.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                    hoveredFeature === feat.id
                      ? "bg-sky/10 text-sky border border-sky/20"
                      : "bg-white border border-ink-dark/10 text-ink-dark/80 hover:border-ink-dark/30"
                  }`}
                >
                  <div className="font-bold truncate">{feat.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actual Code View */}
          <pre className="flex-1 p-4 m-0 bg-[#0F172A] text-slate-300 overflow-auto">
            {lines.map((line, idx) => {
              const isHighlighted =
                hoveredFeature && line.featureId === hoveredFeature;
              return (
                <div
                  key={idx}
                  className={`flex hover:bg-slate-700/50 transition-colors ${
                    isHighlighted ? "bg-sky-500/20" : ""
                  }`}
                >
                  <div className="w-10 shrink-0 text-slate-500 text-right pr-4 select-none border-r border-slate-600/50 mr-4 text-xs py-0.5">
                    {line.num}
                  </div>
                  <div
                    className={`flex-1 text-xs py-0.5 ${isHighlighted ? "text-sky-300 font-bold" : ""}`}
                  >
                    {line.code || " "}
                  </div>
                  {/* Visual Tether indicator */}
                  {isHighlighted && (
                    <div className="text-sky-400 text-[10px] uppercase font-bold px-2 self-center flex items-center gap-1 opacity-70">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      {hoveredFeature}
                    </div>
                  )}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
