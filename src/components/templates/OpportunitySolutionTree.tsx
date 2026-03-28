import React from "react";
import { B_H2, B_Badge, B_TextBody, B_Card } from "../BrutalistUI";

/**
 *
 */
export function OpportunitySolutionTree() {
  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0F172A] text-white font-mono">
      <div className="mb-8 border-b-2 border-slate-700 pb-4">
        <B_Badge variant="info" className="mb-2">
          PRODUCT ITERATION
        </B_Badge>
        <B_H2>OPPORTUNITY SOLUTION TREE</B_H2>
        <B_TextBody className="text-sm mt-2 text-slate-400">
          Trace ProductFeatures back to DerivedInsights to prevent "feature
          factory" builds. Powered by DerivedInsight impact scores.
        </B_TextBody>
      </div>

      <div className="flex flex-col gap-8 items-center border-4 border-black p-6 bg-[#1E293B] shadow-[8px_8px_0px_0px_#000000]">
        {/* Outcome Level */}
        <div className="w-full max-w-lg text-center">
          <B_Badge
            variant="success"
            className="mb-2 uppercase font-black text-xs"
          >
            BUSINESS OUTCOME
          </B_Badge>
          <div className="border-4 border-[var(--color-brutal-cyan)] p-4 bg-black font-bold text-lg">
            Increase Mid-Market Retention by 15%
          </div>
        </div>

        {/* Connector Line */}
        <div className="w-1 h-8 bg-slate-500"></div>

        {/* Opportunity Level */}
        <div className="flex w-full justify-center gap-10">
          <div className="w-1/2 max-w-sm text-center">
            <B_Badge
              variant="warning"
              className="mb-2 uppercase font-black text-xs"
            >
              MARKET INSIGHT (OPPORTUNITY)
            </B_Badge>
            <div className="border-4 border-[var(--color-brutal-chartreuse)] p-4 bg-slate-900 font-bold">
              "Users churn because CRM integrations are too shallow."
            </div>
            <div className="mt-2 text-xs text-[var(--color-brutal-chartreuse)] font-black">
              IMPACT: HIGH
            </div>
          </div>

          <div className="w-1/2 max-w-sm text-center">
            <B_Badge
              variant="warning"
              className="mb-2 uppercase font-black text-xs"
            >
              MARKET INSIGHT (THREAT)
            </B_Badge>
            <div className="border-4 border-[var(--color-brutal-red)] p-4 bg-slate-900 font-bold">
              "Competitor X launched an AI Workflow Builder."
            </div>
            <div className="mt-2 text-xs text-[var(--color-brutal-red)] font-black">
              IMPACT: CRITICAL
            </div>
          </div>
        </div>

        {/* Connector Lines */}
        <div className="flex w-full justify-around max-w-3xl">
          <div className="w-1 h-8 bg-slate-500"></div>
          <div className="w-1 h-8 bg-slate-500"></div>
        </div>

        {/* Solutions Level */}
        <div className="flex w-full justify-around gap-10">
          <div className="w-1/3 text-center">
            <B_Badge
              variant="info"
              className="mb-2 uppercase font-black text-xs"
            >
              FEATURE
            </B_Badge>
            <div className="border-4 border-slate-500 p-4 bg-black">
              Deep Salesforce Two-Way Sync
            </div>
          </div>
          <div className="w-1/3 text-center opacity-50">
            <B_Badge
              variant="info"
              className="mb-2 uppercase font-black text-xs"
            >
              FEATURE
            </B_Badge>
            <div className="border-4 border-dashed border-slate-500 p-4 bg-black">
              HubSpot Contact Mapper
            </div>
          </div>
          <div className="w-1/3 text-center">
            <B_Badge
              variant="info"
              className="mb-2 uppercase font-black text-xs"
            >
              FEATURE
            </B_Badge>
            <div className="border-4 border-slate-500 p-4 bg-black">
              Custom Workflow Templates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
