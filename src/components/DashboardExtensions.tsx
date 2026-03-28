import React, { useState } from "react";
import { SuggestionFeed } from "./SuggestionFeed";
import { CapabilityGapDashboard } from "./CapabilityGapDashboard";
import { FakeDoorMetrics } from "./FakeDoorMetrics";
import { VisualSyncModal } from "./VisualSyncModal";
import { DeploymentWizardModal } from "./DeploymentWizardModal";
import { Camera, Rocket } from "lucide-react";
import { MyProductData } from "./MyProduct";
import { DerivedInsight, Competitor } from "../types";

interface DashboardExtensionsProps {
  productData: MyProductData;
  setProductData: React.Dispatch<React.SetStateAction<MyProductData>>;
  insights: DerivedInsight[];
  competitors: Competitor[];
}

export const DashboardExtensions: React.FC<DashboardExtensionsProps> = ({
  productData,
  setProductData,
  insights,
  competitors,
}) => {
  const [isVisualSyncOpen, setIsVisualSyncOpen] = useState(false);
  const [isDeploymentOpen, setIsDeploymentOpen] = useState(false);

  const handleAcceptSuggestion = (
    name: string,
    description: string,
    insightId: string,
  ) => {
    setProductData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          id: Math.random().toString(36).substring(7),
          name,
          description,
          status: "planned",
          provenance: { sourceType: "ai_suggestion", sourceId: insightId },
        },
      ],
    }));
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 mt-8">
      {/* Quick Actions Panel */}
      <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-sm flex gap-4 justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-ink-dark">Evolution Tools</h3>
          <p className="text-sm text-ink-muted mt-1">
            Accelerate product development with AI.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsVisualSyncOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-paper-base border border-ink-dark/20 rounded-lg hover:border-sky/50 hover:bg-sky/5 transition-all text-sm font-medium text-ink-dark shadow-sm"
          >
            <Camera size={18} className="text-sky" /> Visual Sync
          </button>
          <button
            onClick={() => setIsDeploymentOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F38020] text-white rounded-lg hover:bg-[#d6701c] transition-all text-sm font-bold shadow-sm"
          >
            <Rocket size={18} /> Deploy Smoke Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <FakeDoorMetrics siteToken="demo-site-token" />
          <SuggestionFeed
            insights={insights}
            productData={productData}
            onAccept={handleAcceptSuggestion}
          />
        </div>
        <div>
          <CapabilityGapDashboard
            productData={productData}
            competitors={competitors}
          />
        </div>
      </div>

      <VisualSyncModal
        isOpen={isVisualSyncOpen}
        onClose={() => setIsVisualSyncOpen(false)}
        myProductData={productData}
        setMyProductData={setProductData}
      />

      <DeploymentWizardModal
        isOpen={isDeploymentOpen}
        onClose={() => setIsDeploymentOpen(false)}
        myProductData={productData}
      />
    </div>
  );
};
