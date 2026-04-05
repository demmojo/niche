import fs from "fs";

let content = fs.readFileSync("src/components/TrustBuilderScreen.tsx", "utf8");

// 1. Add useRef to imports
content = content.replace(
  `import { useState, useEffect } from "react";`,
  `import { useState, useEffect, useRef } from "react";`,
);

// 2. Initialize data from sessionStorage
content = content.replace(
  `  const [data, setData] = useState<{
    competitors: number | null;
    jtbdAnalysis: any | null;
    gapAnalysis: any[] | null;
    tarpitScore: any | null;
    finalStrategy: any | null;
  }>({
    competitors: null,
    jtbdAnalysis: null,
    gapAnalysis: null,
    tarpitScore: null,
    finalStrategy: null,
  });`,
  `  const [data, setData] = useState<{
    competitors: number | null;
    jtbdAnalysis: any | null;
    gapAnalysis: any[] | null;
    tarpitScore: any | null;
    finalStrategy: any | null;
  }>(() => {
    try {
      const cached = sessionStorage.getItem("plg_cached_data");
      const cachedIdea = sessionStorage.getItem("plg_cached_idea");
      if (cached && cachedIdea && cachedIdea === JSON.stringify(ideaPayload)) {
        return JSON.parse(cached);
      }
    } catch(e) {}
    return {
      competitors: null,
      jtbdAnalysis: null,
      gapAnalysis: null,
      tarpitScore: null,
      finalStrategy: null,
    };
  });`,
);

// 3. Set up abortControllerRef
content = content.replace(
  `  const { login } = useAuth();`,
  `  const { login } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);`,
);

content = content.replace(
  `  const streamValidation = async (abortController: AbortController) => {`,
  `  const streamValidation = async (abortController: AbortController) => {
    abortControllerRef.current = abortController;`,
);

// 4. Update handleLoginToUnlock
const oldHandleLogin = `  const handleLoginToUnlock = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      setIsPqlGated(false);
      
      // Re-trigger the stream to get the rest of the data
      // We need a new AbortController for the resumed stream
      const resumeController = new AbortController();
      streamValidation(resumeController);
      
      // Cleanup the resumeController if component unmounts before it finishes
      return () => resumeController.abort();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
      setIsLoggingIn(false);
    }
  };`;

const newHandleLogin = `  const handleLoginToUnlock = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    sessionStorage.setItem("plg_cached_data", JSON.stringify(data));
    sessionStorage.setItem("plg_cached_idea", JSON.stringify(ideaPayload));

    setIsLoggingIn(true);
    try {
      await login();
      setIsPqlGated(false);
      
      const resumeController = new AbortController();
      streamValidation(resumeController);
      
      return () => resumeController.abort();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
      setIsLoggingIn(false);
    }
  };`;
content = content.replace(oldHandleLogin, newHandleLogin);

// 5. Update StepLoading to Progressive Skeleton
const oldStepLoading = `function StepLoading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 text-ink-dark/50">
      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
      <span className="text-base font-medium">{title}</span>
    </div>
  );
}`;

const newStepLoading = `function StepLoading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 text-ink-dark/50 animate-pulse">
      <div className="w-5 h-5 rounded-full bg-ink-dark/20 flex-shrink-0" />
      <div className="h-4 bg-ink-dark/20 rounded w-1/2" />
      <span className="sr-only">{title}</span>
    </div>
  );
}`;
content = content.replace(oldStepLoading, newStepLoading);

// 6. Update PQL Gate UI to Blur Tease
const oldPqlGate = `<Accordion.Item value="pqlGate" asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-8 bg-amber-50 rounded-xl border border-amber-200 mt-6 shadow-sm"
                  >
                    <Lock className="w-8 h-8 text-amber-600 mb-4" />
                    <h3 className="text-xl font-bold text-amber-900 mb-2 text-center">
                      Sign up to unlock your Tarpit Score and Strategy
                    </h3>
                    <p className="text-amber-700 text-center mb-6 text-sm">
                      You've successfully validated the core idea. Create a free account to view the final saturation risk score and actionable pivot strategies.
                    </p>
                    <button
                      onClick={handleLoginToUnlock}
                      disabled={isLoggingIn}
                      className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                      Unlock Analysis
                    </button>
                  </motion.div>
                </Accordion.Item>`;

const newPqlGate = `<Accordion.Item value="pqlGate" asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex flex-col items-center justify-center p-8 bg-amber-50 rounded-xl border border-amber-200 mt-6 shadow-sm overflow-hidden"
                  >
                    <div className="absolute inset-0 z-0 opacity-40 blur-[8px] pointer-events-none flex items-center justify-center">
                       <div className="w-64 h-64 rounded-full border-[24px] border-amber-500/20" />
                       <div className="absolute w-32 h-32 rounded-full border-[12px] border-amber-500/40" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <Lock className="w-8 h-8 text-amber-600 mb-4" />
                      <h3 className="text-xl font-bold text-amber-900 mb-2 text-center">
                        Sign up to unlock your Tarpit Score and Strategy
                      </h3>
                      <p className="text-amber-700 text-center mb-6 text-sm max-w-sm">
                        Great start. We've identified key market dynamics. 🔒 Your idea and market data are safely cached. Sign up to save this research and unlock your Tarpit Score.
                      </p>
                      <button
                        onClick={handleLoginToUnlock}
                        disabled={isLoggingIn}
                        className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                        Unlock Analysis
                      </button>
                    </div>
                  </motion.div>
                </Accordion.Item>`;
content = content.replace(oldPqlGate, newPqlGate);

fs.writeFileSync("src/components/TrustBuilderScreen.tsx", content);
