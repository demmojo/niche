import re

with open("src/App.tsx", "r") as f:
    content = f.read()

deep_validation_code = """function DeepValidationButton({
  isSyncing,
  syncProgress,
  handleGlobalSync,
  setShowSyncInfo,
}: any) {
  return (
    <div className="relative group inline-flex items-center justify-center">
      <button
        onClick={() => handleGlobalSync(1)}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-5 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-xl text-sm font-sans font-black uppercase tracking-wider hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300 ${
          isSyncing ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? `Running Campaign... (${syncProgress}%)` : "Run Deep Validation Campaign"}
      </button>

      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-paper-card rounded-2xl shadow-xl border border-ink-dark/20 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <p className="text-sm text-ink-dark mb-2">
          {isSyncing
            ? `Validation in progress. Extracted ${syncProgress}% of competitor profiles.`
            : "Launch a heavy validation campaign to enrich all competitors and calculate market saturation (Tarpit Risk)."}
        </p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-dark/10">
          <span className="text-xs font-bold text-ink-dark/70">COST: 1 ACTION CREDIT</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSyncInfo(true);
            }}
            className="text-xs font-bold text-sky hover:underline pointer-events-auto"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}"""

content = re.sub(r'function SyncNowButton\(\{[\s\S]*?const renderIntegrations =', deep_validation_code + '\n\nconst renderIntegrations =', content)

content = content.replace('<SyncNowButton', '<DeepValidationButton')

with open("src/App.tsx", "w") as f:
    f.write(content)
