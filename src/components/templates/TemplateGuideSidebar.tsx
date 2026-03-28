import React from "react";
import { B_H2, B_H3, B_TextBody, B_Button } from "../BrutalistUI";

interface TemplateGuideSidebarProps {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onConnectData: () => void;
}

export function TemplateGuideSidebar({
  templateId,
  isOpen,
  onClose,
  onConnectData,
}: TemplateGuideSidebarProps) {
  if (!isOpen) return null;

  const renderGuideContent = () => {
    switch (templateId) {
      case "feature-velocity":
        return (
          <div className="space-y-6">
            <section>
              <B_H3>1. The Why</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Identify whether your feature pipeline is human-verified or
                AI-drafted to understand confidence levels before shipping.
              </B_TextBody>
            </section>
            <section>
              <B_H3>2. Prerequisites</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Requires ProductFeature schema with populated `status` and
                `provenance.sourceType` fields.
              </B_TextBody>
            </section>
            <section>
              <B_H3>3. Setup & Mapping</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Click [CONNECT LIVE DATA] below to map your feature tracker
                (e.g., Jira, Linear) to the `MyProductData` array.
              </B_TextBody>
            </section>
            <section>
              <B_H3>4. How to Read</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Solid borders indicate Human verification. Halftone/dashed
                blocks represent AI-generated drafts `[🤖 AI DRAFT]`. If AI
                drafts outpace human verification, you have a validation
                bottleneck.
              </B_TextBody>
            </section>
            <section>
              <B_H3>5. Next Best Actions</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Review all AI drafts marked "Pending" and approve or discard
                them in the Product Hub.
              </B_TextBody>
            </section>
          </div>
        );
      case "fake-door":
        return (
          <div className="space-y-6">
            <section>
              <B_H3>1. The Why</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Validate GTM demand for unreleased features via conversion
                intent tracking before committing engineering resources.
              </B_TextBody>
            </section>
            <section>
              <B_H3>2. Prerequisites</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Cloudflare Web Analytics or an equivalent event tracking
                integration.
              </B_TextBody>
            </section>
            <section>
              <B_H3>3. Setup & Mapping</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Map your aggregate view events to `pageViews` and your waitlist
                clicks to `conversionIntent`.
              </B_TextBody>
            </section>
            <section>
              <B_H3>4. How to Read</B_H3>
              <B_TextBody className="mt-2 text-sm">
                The funnel visualizes drop-off at every step. If Intent CTR hits
                `&gt; 5%`, statistical significance badges will flag the feature
                as VALIDATED.
              </B_TextBody>
            </section>
            <section>
              <B_H3>5. Next Best Actions</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Promote validated features to "In Progress" in your Feature
                Velocity Roadmap.
              </B_TextBody>
            </section>
          </div>
        );
      case "competitor-matrix":
        return (
          <div className="space-y-6">
            <section>
              <B_H3>1. The Why</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Quickly assess competitive threats by comparing rival
                capabilities directly against your own feature set.
              </B_TextBody>
            </section>
            <section>
              <B_H3>2. Prerequisites</B_H3>
              <B_TextBody className="mt-2 text-sm">
                `Competitor` models with populated `coreFeatures` and an
                assigned `competitorScore`.
              </B_TextBody>
            </section>
            <section>
              <B_H3>3. Setup & Mapping</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Link competitor data from Crunchbase or G2 directly to the
                matrix via the mapping modal.
              </B_TextBody>
            </section>
            <section>
              <B_H3>4. How to Read</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Scores use ASCII blocks: `[██░░]`. A full bar indicates a major
                threat. Competitors with a DEFCON 1 level require immediate
                strategic response.
              </B_TextBody>
            </section>
            <section>
              <B_H3>5. Next Best Actions</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Add capabilities missing from your product to the Lean Canvas or
                SWOT Strategy Workspace.
              </B_TextBody>
            </section>
          </div>
        );
      case "opportunity-solution-tree":
        return (
          <div className="space-y-6">
            <section>
              <B_H3>1. The Why</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Ensure every feature you build solves a real market problem.
                Prevent "feature factory" output by mapping ProductFeatures
                directly to DerivedInsights.
              </B_TextBody>
            </section>
            <section>
              <B_H3>2. Prerequisites</B_H3>
              <B_TextBody className="mt-2 text-sm">
                `DerivedInsight` records and `ProductFeature` arrays with
                populated `provenance.sourceId`.
              </B_TextBody>
            </section>
            <section>
              <B_H3>3. Setup & Mapping</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Link market insights (opportunities or threats) directly to your
                product roadmap.
              </B_TextBody>
            </section>
            <section>
              <B_H3>4. How to Read</B_H3>
              <B_TextBody className="mt-2 text-sm">
                If a feature is visually disconnected from an insight, you are
                building on assumptions. Features tied to "Critical" insights
                should be prioritized.
              </B_TextBody>
            </section>
            <section>
              <B_H3>5. Next Best Actions</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Cancel any "orphan" features that do not trace back to a valid
                market signal.
              </B_TextBody>
            </section>
          </div>
        );
      case "blue-ocean-curve":
        return (
          <div className="space-y-6">
            <section>
              <B_H3>1. The Why</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Identify uncontested market space ("Blue Oceans") by mapping
                competitor investment against your own to find areas where you
                can differentiate.
              </B_TextBody>
            </section>
            <section>
              <B_H3>2. Prerequisites</B_H3>
              <B_TextBody className="mt-2 text-sm">
                `Competitor.coreFeatures` scored against
                `MyProductData.features`.
              </B_TextBody>
            </section>
            <section>
              <B_H3>3. Setup & Mapping</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Define the 5-7 core value factors in your market and map
                competitor capabilities to them.
              </B_TextBody>
            </section>
            <section>
              <B_H3>4. How to Read</B_H3>
              <B_TextBody className="mt-2 text-sm">
                If your curve perfectly matches a competitor, you are in a "Red
                Ocean" fighting on price. Look for deep valleys in competitor
                curves where you can build a peak.
              </B_TextBody>
            </section>
            <section>
              <B_H3>5. Next Best Actions</B_H3>
              <B_TextBody className="mt-2 text-sm">
                Shift your Feature Velocity Roadmap to target the gaps in the
                competitor curves.
              </B_TextBody>
            </section>
          </div>
        );
      default:
        return <B_TextBody>General guide documentation goes here.</B_TextBody>;
    }
  };

  return (
    <div className="w-[400px] h-full bg-[#0f172a] border-l-4 border-slate-700 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200">
      <div className="flex justify-between items-center p-6 border-b-4 border-slate-700">
        <B_H2>TEMPLATE GUIDE</B_H2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white font-mono text-xl"
        >
          [ X ]
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 text-white font-sans">
        {renderGuideContent()}
      </div>

      <div className="p-6 border-t-4 border-slate-700 bg-slate-900">
        <B_Button
          variant="primary"
          className="w-full justify-center"
          onClick={onConnectData}
        >
          [ CONNECT LIVE DATA ]
        </B_Button>
      </div>
    </div>
  );
}
