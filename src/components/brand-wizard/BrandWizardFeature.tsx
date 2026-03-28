import React, { useState } from "react";
import { BrandWizardForm } from "./BrandWizardForm";
import { BrandWizardProgress } from "./BrandWizardProgress";
import { BlueOceanDetected } from "./BlueOceanDetected";
import { useBrandWizardJob } from "../../hooks/useBrandWizardJob";
import { SeaOfSamenessDashboard } from "./SeaOfSamenessDashboard";
import { GuidedBrandWizard } from "./GuidedBrandWizard";

/**
 *
 */
export const BrandWizardFeature: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const { job, error } = useBrandWizardJob(jobId);
  const [showWizard, setShowWizard] = useState(false);

  // If no job started, show the form
  if (!jobId) {
    return (
      <BrandWizardForm
        projectId={projectId}
        onJobStarted={(id) => setJobId(id)}
      />
    );
  }

  // Handle errors explicitly fetching the document
  if (error && !job) {
    return (
      <div className="text-[#FF2A5F] p-4 bg-[#1A1A1A] rounded">
        Error tracking job: {error}
      </div>
    );
  }

  // Show progress if not completed
  if (job?.status === "pending" || job?.status === "processing") {
    return <BrandWizardProgress job={job} />;
  }

  // Job is completed
  if (job?.status === "completed") {
    const validResults = job.results || [];
    
    // Check for "Zero-Data" graceful degradation edge case
    if (validResults.length === 0) {
      return (
        <BlueOceanDetected
          onProceedWithDefaults={() => {
            // Move to guided wizard without competitor context
            console.log("Proceed to Guided Wizard with Defaults");
          }}
        />
      );
    }

    // Render the Dashboard (Task Phase 4)
    if (!showWizard) {
      return (
        <SeaOfSamenessDashboard
          competitors={validResults}
          onContinue={() => setShowWizard(true)}
        />
      );
    }

    // Phase 5 Guided Wizard placeholder
    return (
      <GuidedBrandWizard
        projectId={projectId}
        competitors={validResults}
        onComplete={() => {
          // Final state: show a success message or redirect to project dashboard
          alert("Brand identity successfully created and saved!");
        }}
      />
    );
  }

  return (
    <div className="text-[#888888] p-4 bg-[#1A1A1A] rounded">
      Job {jobId} is in unknown state: {job?.status}
    </div>
  );
};
