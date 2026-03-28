import React, { useState } from "react";
import { IntentRouter } from "./IntentRouter";
import { CompetitorIngestion } from "./CompetitorIngestion";
import { AiThinkingDag } from "./AiThinkingDag";
import { HybridProductBuilder } from "./HybridProductBuilder";

export type IdeationPhase =
  | "routing"
  | "ingestion"
  | "thinking"
  | "hybrid-builder";

/**
 *
 */
export const UnifiedIdeationEngine: React.FC = () => {
  const [phase, setPhase] = useState<IdeationPhase>("routing");
  const [jobId, setJobId] = useState<string | null>(null);

  // State for the product being built
  const [seedIdea, setSeedIdea] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [extractedFeatures, setExtractedFeatures] = useState<any[]>([]);

  /**
   *
   */
  const handleIntentSelected = (intent: "idea" | "brainstorm") => {
    if (intent === "idea") {
      // In a full flow, this would go to Tarpit Analyzer
      // For now, we move them to ingestion
      setPhase("ingestion");
    } else {
      setPhase("ingestion");
    }
  };

  /**
   *
   */
  const handleStartIngestion = async (urls: string[]) => {
    setCompetitorUrls(urls);
    setPhase("thinking");

    try {
      const res = await fetch("/api/ideation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: urls }),
      });

      const data = await res.json();
      if (res.ok) {
        setJobId(data.jobId);
      } else {
        alert(data.error);
        setPhase("ingestion");
      }
    } catch (err) {
      console.error(err);
      setPhase("ingestion");
    }
  };

  /**
   *
   */
  const handleThinkingComplete = (features: any[]) => {
    setExtractedFeatures(features);
    setPhase("hybrid-builder");
  };

  return (
    <div className="w-full h-full bg-paper-base flex flex-col relative overflow-hidden">
      {phase === "routing" && <IntentRouter onSelect={handleIntentSelected} />}

      {phase === "ingestion" && (
        <CompetitorIngestion onStart={handleStartIngestion} />
      )}

      {phase === "thinking" && jobId && (
        <AiThinkingDag
          jobId={jobId}
          competitorsCount={competitorUrls.length}
          onComplete={handleThinkingComplete}
        />
      )}

      {phase === "hybrid-builder" && (
        <HybridProductBuilder
          features={extractedFeatures}
          onFinish={(finalFeatures) => {
            console.log("Final features", finalFeatures);
            // Here we would sync with MyProductData
          }}
        />
      )}
    </div>
  );
};
