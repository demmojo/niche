import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Imports
if 'import { useSafeAITask }' not in content:
    content = content.replace(
        'import { useSyncQueue } from "./hooks/useSyncQueue";',
        'import { useSyncQueue } from "./hooks/useSyncQueue";\nimport { useSafeAITask } from "./hooks/useSafeAITask";'
    )

if 'import { ComputeMeter }' not in content:
    content = content.replace(
        'import { AlphaBadge } from "./components/AlphaBadge";',
        'import { AlphaBadge } from "./components/AlphaBadge";\nimport { ComputeMeter } from "./components/ComputeMeter";\nimport { TarpitWarningModal } from "./components/TarpitWarningModal";\nimport { useActionCredits } from "./hooks/useActionCredits";'
    )

# 2. Add DeepValidationButton component
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

# Replace SyncNowButton with DeepValidationButton
content = re.sub(r'function SyncNowButton\(\{\n.*?\n\}\) \{.*?(?=const renderIntegrations)', deep_validation_code + '\n\n', content, flags=re.DOTALL)

# 3. Replace SyncNowButton usages with DeepValidationButton
content = content.replace('<SyncNowButton', '<DeepValidationButton')

# 4. Add the hooks inside WorkspaceApp
hooks_to_insert = """
  const [isTarpitWarningOpen, setIsTarpitWarningOpen] = useState(false);
  const [tarpitCompetitors, setTarpitCompetitors] = useState<any[]>([]);
  const credits = useActionCredits();

  const { isLocked: isStartingCampaign, executeTask: startCampaignTask } = useSafeAITask({
    timeoutMs: 30000,
    onTimeout: () => {
      addToast("Analysis took too long. Please try again.", "error");
      setIsSyncing(false);
    },
    onError: (err) => {
      addToast(err.message || "Failed to start campaign", "error");
      setIsSyncing(false);
    }
  });
"""
if 'isStartingCampaign' not in content:
    content = content.replace(
        'const [isSyncing, setIsSyncing] = useState(false);',
        'const [isSyncing, setIsSyncing] = useState(false);\n' + hooks_to_insert
    )

new_handle_sync = """  const handleGlobalSync = async (startStage = 1, initialState: any = {}) => {
    if (syncQueue.length > 0) {
      addToast("Please review and commit pending sync changes first.", "error");
      return;
    }
    if (isSyncing || isStartingCampaign) {
      addToast("Campaign already in progress.", "info");
      return;
    }
    
    if (!competitors || competitors.length === 0) {
      addToast("Please add at least 1 competitor first.", "error");
      return;
    }

    setIsSyncing(true);

    startCampaignTask(async (signal) => {
      const res = await fetch("/api/campaign/start", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${await user?.getIdToken()}` 
        },
        body: JSON.stringify({ competitors, baseIdea: myProductData }),
        signal
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Failed to start validation campaign");
      }
      
      const { jobId } = await res.json();
      addToast("Validation campaign started...", "loading");
      
      const jobRef = doc(db, "campaign_jobs", jobId);
      
      const unsubscribe = onSnapshot(jobRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        
        if (data.total && data.total > 0) {
            setActiveTasks([
              { id: "1", name: "Deep Validation Campaign", progress: Math.min(Math.round((data.progress / data.total) * 100), 99) }
            ]);
        }
        
        if (data.status === "completed") {
          setIsSyncing(false);
          setActiveTasks([{ id: "1", name: "Deep Validation Campaign", progress: 100 }]);
          setTimeout(() => setActiveTasks([]), 3000);
          unsubscribe();
          
          const results = data.results || [];
          const highRisk = results.filter((c: any) => c.trueCompetitorScore >= 0.65);
          const cloneRisk = results.filter((c: any) => c.trueCompetitorScore >= 0.85);
          
          if (cloneRisk.length >= 1 || highRisk.length >= 4) {
            setTarpitCompetitors(results);
            setIsTarpitWarningOpen(true);
          } else {
            addToast("Validation successful. Market looks clear!", "success");
            setCompetitors(results);
          }
        } else if (data.status === "failed") {
          setIsSyncing(false);
          setActiveTasks([]);
          unsubscribe();
          addToast("Validation failed: " + data.error, "error");
        }
      });
    });
  };"""

content = re.sub(r'  const handleGlobalSync = async \(startStage = 1, initialState: any = \{\}\) => \{.*?(?=  const runSystemCheck = async \(\) => \{)', new_handle_sync + '\n\n', content, flags=re.DOTALL)

# 6. Add ComputeMeter to Top Nav
if '<ComputeMeter credits={credits}' not in content:
    content = content.replace(
        '<AlphaBadge />',
        '<AlphaBadge />\n              <ComputeMeter credits={credits} />'
    )

# 7. Add TarpitWarningModal rendering
if 'isTarpitWarningOpen' in content and '<TarpitWarningModal' not in content:
    content = content.replace(
        '{/* Global Overlays */}',
        '{/* Global Overlays */}\n      {isTarpitWarningOpen && <TarpitWarningModal\n        isOpen={isTarpitWarningOpen}\n        onClose={() => setIsTarpitWarningOpen(false)}\n        competitors={tarpitCompetitors}\n        baseIdea={myProductData}\n      />}'
    )

with open("src/App.tsx", "w") as f:
    f.write(content)
