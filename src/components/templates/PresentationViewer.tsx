import React, { useState } from "react";
import MarketSizeDashboard from "./MarketSizeDashboard";
import { FeatureVelocityRoadmap } from "./FeatureVelocityRoadmap";
import { FakeDoorValidation } from "./FakeDoorValidation";
import { BlueOceanValueCurve } from "./BlueOceanValueCurve";
import { TemplateGuideSidebar } from "./TemplateGuideSidebar";
import { DataConnectionModal } from "./DataConnectionModal";

interface PresentationViewerProps {
  templateId: string;
}

/**
 *
 */
export default function PresentationViewer({
  templateId,
}: PresentationViewerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Render the specific analytical template
  /**
   *
   */
  const renderTemplate = () => {
    switch (templateId) {
      case "market-size":
        return <MarketSizeDashboard templateId={templateId} />;
      case "feature-velocity":
        return <FeatureVelocityRoadmap />;
      case "fake-door":
        return <FakeDoorValidation />;
      case "blue-ocean-curve":
        return <BlueOceanValueCurve />;
      default:
        return (
          <div className="p-10 font-mono text-[var(--color-brutal-cyan)]">
            ENGINE NOT FOUND: {templateId}
          </div>
        );
    }
  };

  // Generic mock schema for the data connection modal
  const templateSchema = [
    { key: "metric_1", label: "Primary Metric", type: "number" },
    { key: "status_field", label: "Status Track", type: "string" },
  ];

  const availableSources = [
    {
      key: "cloudflare_pageviews",
      label: "Cloudflare: Page Views",
      type: "number",
    },
    {
      key: "cloudflare_visitors",
      label: "Cloudflare: Visitors",
      type: "number",
    },
    {
      key: "product_features_status",
      label: "ProductData: Features Status",
      type: "string",
    },
  ];

  return (
    <div className="flex h-full overflow-hidden relative w-full">
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden relative">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 right-4 z-50 bg-black text-white border-2 border-slate-600 px-3 py-1 font-mono text-xs hover:border-[var(--color-brutal-cyan)] transition-colors"
          >
            [ OPEN GUIDE ]
          </button>
        )}
        {renderTemplate()}
      </div>

      {/* Slide-out Contextual Guide Sidebar */}
      <TemplateGuideSidebar
        templateId={templateId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onConnectData={() => setIsModalOpen(true)}
      />

      {/* Data Mapping Modal */}
      <DataConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={(config) => {
          console.log("Applied config:", config);
          // In a real app, dispatch to a store or trigger React Query refetch
        }}
        templateSchema={templateSchema}
        availableSources={availableSources}
      />
    </div>
  );
}
