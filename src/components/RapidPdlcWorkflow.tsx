import React, { useState } from "react";
import { WorkflowCopilotChat, CopilotMessage } from "./WorkflowCopilotChat";
import { ArtifactRenderer } from "./ArtifactRenderer";

/**
 *
 */
export function RapidPdlcWorkflow() {
  const [chatHistory, setChatHistory] = useState<CopilotMessage[]>([
    {
      id: "init",
      role: "ai",
      content:
        "Welcome to the Niche Rapid PDLC Workflow. Describe your hyper-niche product idea in 1-2 sentences to begin market analysis.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);

  const [features, setFeatures] = useState<any[]>([]);
  const [acceptedFeatures, setAcceptedFeatures] = useState<any[]>([]);

  // Simple state machine for the workflow
  const [step, setStep] = useState<number>(1);

  /**
   *
   */
  const handleSendMessage = (content: string) => {
    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI response and step progression
    setTimeout(() => {
      const aiMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "",
      };
      let nextStep = step;

      if (step === 1) {
        // Mocking Competitor Analysis
        aiMsg.content =
          "I've analyzed the market for your idea. Here is a Competitor Matrix based on recent data. Would you like me to generate hyper-niche features for this space?";
        setActiveArtifact("CompetitorMatrix");
        nextStep = 2;
      } else if (step === 2) {
        // Mocking Feature Generation
        aiMsg.content =
          "Here are some hyper-niche feature recommendations. Accept or reject them on the canvas. When you're done, let me know to extract the strategy.";
        const mockFeatures = [
          {
            id: "f1",
            title: "Automated Plumber Dispatch",
            desc: "AI dispatches plumbers based on geographic proximity.",
            status: "pending",
          },
          {
            id: "f2",
            title: "Pipe Flow Analysis AR",
            desc: "AR viewer for hidden pipes.",
            status: "pending",
          },
          {
            id: "f3",
            title: "Customer Dispute resolution AI",
            desc: "Automates small claims.",
            status: "pending",
          },
        ];
        setFeatures(mockFeatures);
        setActiveArtifact("TinderForFeatures");
        nextStep = 3;
      } else if (step === 3) {
        aiMsg.content =
          "I've generated a SWOT and Opportunity Solution Tree based on your accepted features. Would you like me to generate the React code for this MVP?";
        setActiveArtifact("StrategyExtraction");
        nextStep = 4;
      } else if (step === 4) {
        aiMsg.content =
          "Code generated! You can hover over the accepted features to see the exact code implementation. Click [DEPLOY] on the canvas to deploy to Cloudflare Pages.";
        setActiveArtifact("CodeViewer");
        nextStep = 5;
      }

      setChatHistory((prev) => [...prev, aiMsg]);
      setStep(nextStep);
      setIsTyping(false);
    }, 2000);
  };

  /**
   *
   */
  const handleDeploy = () => {
    setActiveArtifact("TerminalUI");
    const aiMsg: CopilotMessage = {
      id: Date.now().toString(),
      role: "ai",
      content: "Deployment initiated. Streaming logs from Cloudflare...",
    };
    setChatHistory((prev) => [...prev, aiMsg]);
    setStep(5);
  };

  /**
   *
   */
  const handleFeatureAccept = (id: string) => {
    const f = features.find((feat) => feat.id === id);
    if (f) setAcceptedFeatures((prev) => [...prev, f]);
    setFeatures((prev) => prev.filter((feat) => feat.id !== id));
  };

  /**
   *
   */
  const handleFeatureReject = (id: string) => {
    setFeatures((prev) => prev.filter((feat) => feat.id !== id));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0F172A]">
      {/* Left Pane: Chat */}
      <div className="w-1/3 min-w-[350px] border-r-4 border-black z-10 flex flex-col h-full bg-[#0F172A] shadow-[8px_0px_0px_0px_rgba(0,0,0,1)]">
        <WorkflowCopilotChat
          chatHistory={chatHistory}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Right Pane: Artifact Renderer */}
      <div className="flex-1 flex flex-col h-full bg-[#1E293B] relative overflow-hidden">
        <ArtifactRenderer
          activeArtifact={activeArtifact}
          features={features}
          onFeatureAccept={handleFeatureAccept}
          onFeatureReject={handleFeatureReject}
          acceptedFeatures={acceptedFeatures}
          onDeploy={handleDeploy}
        />
      </div>
    </div>
  );
}
