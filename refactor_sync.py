import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add import
if 'import { useSafeAITask } from "./hooks/useSafeAITask";' not in content:
    content = content.replace(
        'import { useSyncQueue } from "./hooks/useSyncQueue";',
        'import { useSyncQueue } from "./hooks/useSyncQueue";\nimport { useSafeAITask } from "./hooks/useSafeAITask";'
    )

# 2. Add the hook call inside WorkspaceApp right before handleGlobalSync
hook_code = """
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

  const handleGlobalSync = async (startStage = 1, initialState: any = {}) => {"""

content = content.replace(
    '  const handleGlobalSync = async (startStage = 1, initialState: any = {}) => {',
    hook_code
)

# 3. Replace the body of handleGlobalSync
old_handle_body = """    if (syncQueue.length > 0) {
      addToast("Please review and commit pending sync changes first.", "error");
      return;
    }
    if (isSyncing) {
      addToast("Campaign already in progress.", "info");
      return;
    }
    
    // Fallback if no competitors
    if (!competitors || competitors.length === 0) {
      addToast("Please add at least 1 competitor first.", "error");
      return;
    }

    try {
      setIsSyncing(true);
      
      const res = await fetch("/api/campaign/start", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${await user?.getIdToken()}` 
        },
        body: JSON.stringify({ competitors, baseIdea: myProductData })
      });
      
      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || data.message || "Failed to start validation campaign", "error");
        setIsSyncing(false);
        return;
      }
      
      const { jobId } = await res.json();
      addToast("Validation campaign started...", "loading");
      
      const jobRef = doc(db, "campaign_jobs", jobId);
      
      const unsubscribe = onSnapshot(jobRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        
        // Update progress banner
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
          
          // Check Tarpit Math
          const highRisk = results.filter((c: any) => c.trueCompetitorScore >= 0.65);
          const cloneRisk = results.filter((c: any) => c.trueCompetitorScore >= 0.85);
          
          if (cloneRisk.length >= 1 || highRisk.length >= 4) {
            setTarpitCompetitors(results);
            setIsTarpitWarningOpen(true);
          } else {
            addToast("Validation successful. Market looks clear!", "success");
            setCompetitors(results); // Map results back to update local UI
          }
        } else if (data.status === "failed") {
          setIsSyncing(false);
          setActiveTasks([]);
          unsubscribe();
          addToast("Validation failed: " + data.error, "error");
        }
      });
      
    } catch (e: any) {
      setIsSyncing(false);
      addToast(e.message || "Failed to start campaign", "error");
    }"""

new_handle_body = """    if (syncQueue.length > 0) {
      addToast("Please review and commit pending sync changes first.", "error");
      return;
    }
    if (isSyncing || isStartingCampaign) {
      addToast("Campaign already in progress.", "info");
      return;
    }
    
    // Fallback if no competitors
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
        
        // Update progress banner
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
          
          // Check Tarpit Math
          const highRisk = results.filter((c: any) => c.trueCompetitorScore >= 0.65);
          const cloneRisk = results.filter((c: any) => c.trueCompetitorScore >= 0.85);
          
          if (cloneRisk.length >= 1 || highRisk.length >= 4) {
            setTarpitCompetitors(results);
            setIsTarpitWarningOpen(true);
          } else {
            addToast("Validation successful. Market looks clear!", "success");
            setCompetitors(results); // Map results back to update local UI
          }
        } else if (data.status === "failed") {
          setIsSyncing(false);
          setActiveTasks([]);
          unsubscribe();
          addToast("Validation failed: " + data.error, "error");
        }
      });
    });"""

content = content.replace(old_handle_body, new_handle_body)

with open("src/App.tsx", "w") as f:
    f.write(content)
