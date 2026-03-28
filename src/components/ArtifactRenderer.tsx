import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CompetitorThreatMatrix } from "./templates/CompetitorThreatMatrix";
import { OpportunitySolutionTree } from "./templates/OpportunitySolutionTree";

// Lazy loaded artifacts for performance
const TinderForFeatures = React.lazy(
  () => import("./artifacts/TinderForFeatures"),
);
const CodeViewerArtifact = React.lazy(
  () => import("./artifacts/CodeViewerArtifact"),
);
const TerminalUIArtifact = React.lazy(
  () => import("./artifacts/TerminalUIArtifact"),
);

interface ArtifactRendererProps {
  activeArtifact: string | null;
  features?: any[];
  onFeatureAccept?: (id: string) => void;
  onFeatureReject?: (id: string) => void;
  acceptedFeatures?: any[];
  onDeploy?: () => void;
}

/**
 *
 */
export function ArtifactRenderer({
  activeArtifact,
  features,
  onFeatureAccept,
  onFeatureReject,
  acceptedFeatures,
  onDeploy,
}: ArtifactRendererProps) {
  if (!activeArtifact) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xl uppercase tracking-widest bg-[#1E293B]">
        [ WAITING FOR COPILOT COMMAND ]
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0F172A] relative overflow-hidden">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-brutal-cyan)] font-mono animate-pulse">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />[ LOADING
            ARTIFACT ]
          </div>
        }
      >
        {activeArtifact === "CompetitorMatrix" && <CompetitorThreatMatrix />}

        {activeArtifact === "TinderForFeatures" && (
          <TinderForFeatures
            features={features || []}
            onAccept={onFeatureAccept || (() => {})}
            onReject={onFeatureReject || (() => {})}
          />
        )}

        {activeArtifact === "StrategyExtraction" && (
          <div className="h-full overflow-auto">
            {/* Can compose SWOT and OST here or just show OST */}
            <OpportunitySolutionTree />
          </div>
        )}

        {activeArtifact === "CodeViewer" && (
          <CodeViewerArtifact
            acceptedFeatures={acceptedFeatures || []}
            onDeploy={onDeploy}
          />
        )}

        {activeArtifact === "TerminalUI" && <TerminalUIArtifact />}
      </Suspense>
    </div>
  );
}
