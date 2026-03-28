import React from "react";

/**
 *
 */
export const BlueOceanDetected: React.FC<{
  onProceedWithDefaults: () => void;
}> = ({ onProceedWithDefaults }) => {
  return (
    <div className="w-full max-w-2xl bg-gradient-to-br from-[#0C0C0C] to-[#0A1128] border border-[#00B4D8] p-8 rounded-md font-['JetBrains_Mono'] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00B4D8] rounded-full filter blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <h2 className="text-[#00B4D8] text-3xl font-bold mb-4 font-['Clash_Display']">
        🌊 Blue Ocean Detected
      </h2>
      <p className="text-[#F2F2F2] text-lg mb-6 leading-relaxed">
        We could not extract any meaningful competitor branding data from the
        URLs you provided. Either your competitors have extremely poor digital
        footprints, or you have discovered a true <strong>Blue Ocean</strong>{" "}
        niche with zero established visual conventions.
      </p>

      <div className="bg-[#1A1A1A] border border-[#333333] p-4 rounded text-sm text-[#888888] mb-8">
        <strong>Graceful Degradation Active:</strong> We will proceed using broad
        industry defaults as your baseline. This gives you maximum freedom to
        define the visual language of this new market category.
      </div>

      <button
        onClick={onProceedWithDefaults}
        className="w-full bg-[#00B4D8] text-[#0C0C0C] font-bold py-4 rounded hover:bg-[#0096C7] transition-all duration-300 transform hover:-translate-y-1 shadow-[0_0_20px_rgba(0,180,216,0.3)]"
      >
        Set the Industry Standard
      </button>
    </div>
  );
};
