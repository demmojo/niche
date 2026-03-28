import React from "react";
import { B_H2, B_Card, B_Badge, B_TextBody } from "../BrutalistUI";

interface FeatureDataPoint {
  id: string;
  name: string;
  status: "planned" | "in-progress" | "completed" | "pending-review";
  aiProvenance: "ai_suggestion" | "human";
}

// Mock Adapter Output (Normalized)
const mockFeatures: FeatureDataPoint[] = [
  {
    id: "f1",
    name: "Predictive Churn Model",
    status: "planned",
    aiProvenance: "ai_suggestion",
  },
  {
    id: "f2",
    name: "SSO Integration (SAML)",
    status: "in-progress",
    aiProvenance: "human",
  },
  {
    id: "f3",
    name: "Automated Report Generation",
    status: "pending-review",
    aiProvenance: "ai_suggestion",
  },
  {
    id: "f4",
    name: "Role-Based Access Control",
    status: "completed",
    aiProvenance: "human",
  },
];

export function FeatureVelocityRoadmap() {
  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0F172A] text-white">
      <div className="mb-8 border-b-2 border-slate-700 pb-4">
        <B_Badge variant="info" className="mb-2">
          PRODUCT VELOCITY
        </B_Badge>
        <B_H2>AI FEATURE ROADMAP</B_H2>
        <B_TextBody className="text-sm mt-2">
          Tracking product delivery with Optical Honesty mapping for AI vs.
          Human provenance.
        </B_TextBody>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
        {/* Optical Honesty Legend */}
        <B_Card className="md:col-span-2 flex gap-8 items-center border-b-4 border-slate-700 pb-6 mb-4">
          <span className="font-bold uppercase tracking-tight text-sm">
            PROVENANCE LEGEND:
          </span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--color-brutal-chartreuse)] bg-white"></div>
            <span className="text-xs">HUMAN-VERIFIED (Solid)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 border-2 border-dashed border-slate-400"
              style={{
                backgroundImage:
                  "radial-gradient(#475569 1px, transparent 1px)",
                backgroundSize: "4px 4px",
              }}
            ></div>
            <span className="text-xs">AI DRAFT (Halftone)</span>
          </div>
        </B_Card>

        {/* Feature List */}
        {mockFeatures.map((feature) => (
          <div
            key={feature.id}
            className={`p-6 transition-all relative ${
              feature.aiProvenance === "ai_suggestion"
                ? "border-4 border-dashed border-slate-600 bg-[#1E293B]"
                : "border-4 border-[var(--color-brutal-cyan)] bg-[#0F172A] shadow-[6px_6px_0px_0px_var(--color-brutal-cyan)]"
            }`}
            style={
              feature.aiProvenance === "ai_suggestion"
                ? {
                    backgroundImage:
                      "radial-gradient(#334155 1.5px, transparent 1.5px)",
                    backgroundSize: "8px 8px",
                  }
                : {}
            }
          >
            <div className="flex justify-between items-start mb-4 bg-black/40 p-2 rounded-sm backdrop-blur-sm inline-flex w-full">
              <h3
                className={`text-xl font-bold tracking-tight uppercase ${
                  feature.aiProvenance === "human"
                    ? "text-white"
                    : "text-slate-300"
                }`}
              >
                {feature.name}
              </h3>
              {feature.aiProvenance === "ai_suggestion" && (
                <span className="bg-black text-[var(--color-brutal-cyan)] border-2 border-[var(--color-brutal-cyan)] px-2 py-1 text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_var(--color-brutal-cyan)]">
                  [🤖 AI DRAFT]
                </span>
              )}
            </div>

            {/* ASCII Progress Bar */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Status: {feature.status.replace("-", " ")}</span>
                <span>
                  {feature.status === "completed"
                    ? "100%"
                    : feature.status === "in-progress"
                      ? "50%"
                      : feature.status === "pending-review"
                        ? "80%"
                        : "0%"}
                </span>
              </div>
              <div className="w-full bg-slate-800 border-2 border-black h-4 overflow-hidden relative">
                <div
                  className={`h-full ${
                    feature.aiProvenance === "human"
                      ? "bg-[var(--color-brutal-chartreuse)]"
                      : "bg-slate-500"
                  }`}
                  style={{
                    width:
                      feature.status === "completed"
                        ? "100%"
                        : feature.status === "in-progress"
                          ? "50%"
                          : feature.status === "pending-review"
                            ? "80%"
                            : "0%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
