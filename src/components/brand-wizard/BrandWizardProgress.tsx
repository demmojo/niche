import React from "react";
import { BrandWizardJob } from "../../hooks/useBrandWizardJob";

/**
 *
 */
export const BrandWizardProgress: React.FC<{ job: BrandWizardJob }> = ({
  job,
}) => {
  const { totalUrls, completed, failed } = job.progress;
  const processed = completed + failed;
  const percentage = totalUrls === 0 ? 0 : Math.round((processed / totalUrls) * 100);

  return (
    <div className="w-full max-w-2xl bg-[#0C0C0C] border border-[#1A1A1A] p-6 rounded-md font-['JetBrains_Mono']">
      <h2 className="text-[#F2F2F2] text-xl font-bold mb-4 font-['Clash_Display']">
        Extracting Competitor Data
      </h2>

      <div className="mb-2 flex justify-between text-sm text-[#888888]">
        <span>
          Analyzing {processed} of {totalUrls} domains...
        </span>
        <span>{percentage}%</span>
      </div>

      <div className="w-full bg-[#1A1A1A] rounded-full h-2.5 mb-4 overflow-hidden border border-[#333333]">
        <div
          className="bg-[#CCFF00] h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="flex gap-4 text-xs mt-4">
        {completed > 0 && (
          <span className="text-[#00FF66]">{completed} Extracted</span>
        )}
        {failed > 0 && (
          <span className="text-[#FF2A5F]">{failed} Failed (Graceful Degradation)</span>
        )}
      </div>
      
      {job.status === "failed" && (
        <div className="mt-4 p-4 bg-[#FF2A5F]/10 border border-[#FF2A5F] text-[#FF2A5F] rounded text-sm">
          Extraction failed: {job.error}
        </div>
      )}
    </div>
  );
};
