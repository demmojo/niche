import React, { useMemo, useState } from "react";
import { ArrowLeft, Beaker, Play } from "lucide-react";

// Tools
import { CompetitorFeatureGap } from "./tools/CompetitorFeatureGap";
import { JTBDLandscape } from "./tools/JTBDLandscape";
import { AssumptionMapping } from "./tools/AssumptionMapping";
import { FakeDoorValidation } from "./tools/FakeDoorValidation";
import { BlueOceanValueCurve } from "./tools/BlueOceanValueCurve";
import { ContinuousFeatureAudit } from "./tools/ContinuousFeatureAudit";
import { ArtifactGenerationModal } from "./ArtifactGenerationModal";

interface ToolboxEngineProps {
  toolId: string;
  toolName: string;
  onClose: () => void;
}

export const ToolboxEngine: React.FC<ToolboxEngineProps> = ({
  toolId,
  toolName,
  onClose,
}) => {
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);

  const ActiveComponent = useMemo(() => {
    switch (toolId) {
      case "competitor-feature-gap":
        return <CompetitorFeatureGap />;
      case "jtbd-opportunity":
        return <JTBDLandscape />;
      case "assumption-mapping":
        return <AssumptionMapping />;
      case "fake-door-validation":
        return <FakeDoorValidation />;
      case "blue-ocean-curve":
        return <BlueOceanValueCurve />;
      case "continuous-feature-audit":
        return <ContinuousFeatureAudit />;
      default:
        return (
          <div className="bg-white border border-ink-dark/10 rounded-xl shadow-sm p-8 min-h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-sky/10 text-sky rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Beaker size={32} />
              </div>
              <h3 className="text-xl font-bold text-ink-dark mb-2">
                Loading {toolName}...
              </h3>
              <p className="text-ink-dark/60">
                This tool connects to the Data Sync Layer to pre-fetch
                unstructured signals and compute mathematical formulas.
              </p>
            </div>
          </div>
        );
    }
  }, [toolId, toolName]);

  return (
    <div className="h-full flex flex-col bg-paper-base animate-in fade-in zoom-in-95 duration-200">
      <header className="px-6 py-4 border-b border-ink-dark/10 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-ink-dark/5 rounded-full text-ink-dark/60 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold font-serif text-ink-dark">
              {toolName}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-sky/10 text-sky border border-sky/20 rounded-lg hover:bg-sky/20 transition-colors text-sm font-medium">
            <Beaker size={16} />
            Generate Experiment
          </button>
          <button
            onClick={() => setIsArtifactModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
          >
            <Play size={16} />
            Generate Blueprint
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex relative">
        {/* Main Canvas Area */}
        <div className="flex-1 overflow-y-auto p-6">{ActiveComponent}</div>

        {/* Methodology Sidebar */}
        <div className="w-80 shrink-0 border-l border-ink-dark/10 bg-white overflow-y-auto p-6 hidden md:block">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-ink-dark/50 font-bold mb-4">
            Methodology & Data Lineage
          </h4>
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-ink-dark mb-2">
                Why use this?
              </h5>
              <p className="text-sm text-ink-dark/70 leading-relaxed">
                De-risk your early-stage product by applying mathematical rigor
                to external market signals, not just internal telemetry.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-ink-dark mb-2">Data Source</h5>
              <p className="text-sm text-ink-dark/70 leading-relaxed mb-2">
                This tool actively syncs with the{" "}
                <code className="bg-ink-dark/5 px-1 py-0.5 rounded text-xs font-mono">
                  ExternalSignalsSyncJob
                </code>
                .
              </p>
              <ul className="text-sm text-ink-dark/70 space-y-1 pl-4 list-disc">
                <li>Exa API (Sentiment & Intent)</li>
                <li>Apollo.io (Firmographics)</li>
                <li>Local Firebase Data</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-ink-dark/10">
              <h5 className="font-semibold text-ink-dark mb-2">
                Performance & UI Note
              </h5>
              <p className="text-xs text-ink-dark/60 leading-relaxed">
                In production, tools rendering over 500 nodes utilize
                down-sampling to prevent SVG DOM bloat, keeping the UI
                responsive.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ArtifactGenerationModal
        isOpen={isArtifactModalOpen}
        onClose={() => setIsArtifactModalOpen(false)}
        contextData={{ toolId, toolName }}
      />
    </div>
  );
};
