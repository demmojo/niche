import React, { useState, Suspense } from "react";
import {
  B_H1,
  B_H2,
  B_TextBody,
  B_Card,
  B_Badge,
  B_Button,
} from "./BrutalistUI";

const PresentationViewer = React.lazy(
  () => import("./templates/PresentationViewer"),
);
const StrategyWorkspace = React.lazy(
  () => import("./templates/StrategyWorkspace"),
);

export function AnalyticalTemplateSystem() {
  const [activeTemplate, setActiveTemplate] = useState<{
    id: string;
    type: "presentation" | "strategy";
    title: string;
  } | null>(null);

  const templates = [
    {
      id: "market-size",
      type: "presentation" as const,
      title: "Market Size by Competitor",
      description: "High-density visual dashboard for executive overview.",
    },
    {
      id: "swot",
      type: "strategy" as const,
      title: "SWOT Analysis",
      description:
        "Generative workspace for Strengths, Weaknesses, Opportunities, and Threats.",
    },
    {
      id: "lean-canvas",
      type: "strategy" as const,
      title: "Lean Canvas",
      description: "Interactive grid for business model formulation.",
    },
  ];

  if (activeTemplate) {
    return (
      <div className="flex flex-col h-full bg-[#0F172A] p-6 text-white overflow-hidden min-h-[calc(100vh-100px)]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <B_H2>{activeTemplate.title}</B_H2>
          <B_Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTemplate(null)}
          >
            Back to Gallery
          </B_Button>
        </div>
        <div className="flex-1 overflow-auto bg-[#1E293B] rounded-lg border-2 border-slate-700">
          <Suspense
            fallback={
              <div className="p-10 font-mono text-[var(--color-brutal-cyan)] animate-pulse">
                LOADING ENGINE...
              </div>
            }
          >
            {activeTemplate.type === "presentation" ? (
              <PresentationViewer templateId={activeTemplate.id} />
            ) : (
              <StrategyWorkspace templateId={activeTemplate.id} />
            )}
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0F172A] min-h-[calc(100vh-100px)] text-white">
      <div className="mb-10">
        <B_H1>TEMPLATE GALLERY</B_H1>
        <B_TextBody className="mt-2 text-slate-400">
          Select a template to launch the appropriate analytical engine.
        </B_TextBody>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Presentation Templates */}
        <div>
          <B_H2 className="mb-6 border-b-2 border-slate-700 pb-2">
            PRESENTATION
          </B_H2>
          <B_TextBody className="mb-6 text-sm">
            Read-optimized, high-density visual dashboards. Focuses on
            Progressive Disclosure and Action-Oriented Design.
          </B_TextBody>
          <div className="space-y-4">
            {templates
              .filter((t) => t.type === "presentation")
              .map((template) => (
                <B_Card
                  key={template.id}
                  className="cursor-pointer hover:border-[var(--color-brutal-cyan)] transition-colors group"
                  onClick={() => setActiveTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-display font-bold group-hover:text-[var(--color-brutal-cyan)] transition-colors">
                      {template.title}
                    </h3>
                    <B_Badge variant="info">DASHBOARD</B_Badge>
                  </div>
                  <B_TextBody className="text-sm">
                    {template.description}
                  </B_TextBody>
                </B_Card>
              ))}
          </div>
        </div>

        {/* Strategy Templates */}
        <div>
          <B_H2 className="mb-6 border-b-2 border-slate-700 pb-2">
            STRATEGY
          </B_H2>
          <B_TextBody className="mb-6 text-sm">
            Write-optimized, generative workspaces. Focuses on Split-Pane
            Workflows and Agentic Assistance.
          </B_TextBody>
          <div className="space-y-4">
            {templates
              .filter((t) => t.type === "strategy")
              .map((template) => (
                <B_Card
                  key={template.id}
                  className="cursor-pointer hover:border-[var(--color-brutal-chartreuse)] transition-colors group"
                  onClick={() => setActiveTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-display font-bold group-hover:text-[var(--color-brutal-chartreuse)] transition-colors">
                      {template.title}
                    </h3>
                    <B_Badge variant="success">WORKSPACE</B_Badge>
                  </div>
                  <B_TextBody className="text-sm">
                    {template.description}
                  </B_TextBody>
                </B_Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
