import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Download,
  Copy,
  Check,
  Code,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { MyProductData } from "./MyProduct";
import { generateSystemPrompt, PromptConfig } from "../utils/promptAssembler";
import { useProjectBrandIdentity } from "../hooks/useProjectBrandIdentity";

interface StrategyToCodeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  myProductData: MyProductData;
  setProductData: React.Dispatch<React.SetStateAction<MyProductData>>;
  projectId: string;
}

export const StrategyToCodeWizard: React.FC<StrategyToCodeWizardProps> = ({
  isOpen,
  onClose,
  myProductData,
  setProductData,
  projectId,
}) => {
  const brandState = useProjectBrandIdentity(projectId);
  const brandIdentity = brandState.status === "success" ? brandState.data : null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<PromptConfig>({
    scope: "app",
    techStack: "react-tailwind",
    contextLevel: "strict",
    enforceBrand: !!brandIdentity,
  });

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [codeToReview, setCodeToReview] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleNextToHandoff = () => {
    const prompt = generateSystemPrompt(myProductData, config, brandIdentity);
    setGeneratedPrompt(prompt);
    setStep(2);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setIsCopied(true);
      
      // Save metadata
      const newExport = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        scope: config.scope,
        stack: config.techStack,
        status: "exported" as const,
      };
      
      setProductData((prev) => ({
        ...prev,
        generatedPrompts: [...(prev.generatedPrompts || []), newExport],
      }));

      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${myProductData.name.replace(/\s+/g, "-").toLowerCase()}-system-prompt.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    if (!codeToReview.trim()) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      const response = await fetch("/api/reviewArtifact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToReview,
          constraints: generatedPrompt,
          brandTone: brandIdentity?.selected_identity?.positioning?.tone || "",
        }),
      });
      const result = await response.json();
      setValidationResult(result);
      
      // Update metadata status if needed
      setProductData((prev) => {
        const prompts = [...(prev.generatedPrompts || [])];
        if (prompts.length > 0) {
          prompts[prompts.length - 1].status = "validated";
        }
        return { ...prev, generatedPrompts: prompts };
      });
    } catch (error) {
      console.error("Validation failed", error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-ink-dark/10 bg-paper-base">
          <div>
            <h2 className="text-2xl font-bold text-ink-dark flex items-center gap-2">
              <Code className="text-sky" /> Rapid Strategy-to-Code
            </h2>
            <p className="text-sm text-ink-dark/60 mt-1">
              Export optimized prompts for external visual AI generators (v0, Bolt, Claude).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-dark/50 hover:text-ink-dark hover:bg-black/5 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="flex bg-paper-base/50 border-b border-ink-dark/10 p-4">
          <div className={`flex-1 text-center font-medium ${step >= 1 ? "text-sky" : "text-ink-dark/40"}`}>
            1. Configure
          </div>
          <ChevronRight className="text-ink-dark/20" />
          <div className={`flex-1 text-center font-medium ${step >= 2 ? "text-sky" : "text-ink-dark/40"}`}>
            2. Handoff
          </div>
          <ChevronRight className="text-ink-dark/20" />
          <div className={`flex-1 text-center font-medium ${step === 3 ? "text-sky" : "text-ink-dark/40"}`}>
            3. Validate
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto py-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-ink-dark border-b border-ink-dark/10 pb-2">Scope</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(["app", "component"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setConfig({ ...config, scope: s })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        config.scope === s
                          ? "border-sky bg-sky/5 text-sky-dark"
                          : "border-ink-dark/10 hover:border-ink-dark/30 text-ink-dark"
                      }`}
                    >
                      <div className="font-semibold capitalize">{s}</div>
                      <div className="text-sm opacity-80 mt-1">
                        {s === "app" ? "Generate a full application layout." : "Generate a single isolated component."}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-ink-dark border-b border-ink-dark/10 pb-2">Tech Stack</h3>
                <div className="grid grid-cols-3 gap-4">
                  {(["react-tailwind", "vue", "svelte"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setConfig({ ...config, techStack: t })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        config.techStack === t
                          ? "border-sky bg-sky/5 text-sky-dark font-semibold"
                          : "border-ink-dark/10 hover:border-ink-dark/30 text-ink-dark"
                      }`}
                    >
                      {t === "react-tailwind" ? "React + Tailwind" : t === "vue" ? "Vue 3" : "Svelte 5"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-ink-dark border-b border-ink-dark/10 pb-2">Brand Identity</h3>
                <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-ink-dark/10 hover:border-ink-dark/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enforceBrand}
                    onChange={(e) => setConfig({ ...config, enforceBrand: e.target.checked })}
                    disabled={!brandIdentity}
                    className="mt-1 w-5 h-5 text-sky rounded focus:ring-sky"
                  />
                  <div>
                    <div className="font-semibold text-ink-dark">Enforce Brand Identity (Colors, Fonts, Tone)</div>
                    <div className="text-sm text-ink-dark/60 mt-1">
                      {brandIdentity 
                        ? "Inject the project's selected brand personality and shadcn/ui HSL overrides." 
                        : "No brand identity configured for this project."}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="bg-slate-900 rounded-xl p-4 flex-1 overflow-auto font-mono text-sm text-slate-300">
                <pre className="whitespace-pre-wrap">{generatedPrompt}</pre>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-ink-dark text-white rounded-xl hover:bg-black transition-colors font-medium"
                >
                  {isCopied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                  {isCopied ? "Copied! 🚀" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 border-2 border-ink-dark/20 text-ink-dark rounded-xl hover:bg-ink-dark/5 transition-colors font-medium flex items-center gap-2"
                >
                  <Download size={20} />
                  Download .md
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 flex flex-col h-full">
              <div className="bg-amber-50 text-amber-900 p-4 rounded-xl text-sm flex gap-3 border border-amber-200">
                <AlertCircle className="shrink-0" />
                <div>
                  Paste the code generated by your external AI tool below. Our Critic model will review it against your strategic constraints and brand tone to ensure it meets quality standards.
                </div>
              </div>
              
              <textarea
                value={codeToReview}
                onChange={(e) => setCodeToReview(e.target.value)}
                placeholder="Paste the generated UI code here..."
                className="flex-1 w-full p-4 font-mono text-sm bg-paper-base border border-ink-dark/20 rounded-xl focus:border-sky focus:ring-1 focus:ring-sky resize-none"
              />

              {validationResult && (
                <div className={`p-4 rounded-xl border-2 ${validationResult.isToneCompliant !== false && validationResult.isStackCompliant !== false ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-rose-500 bg-rose-50 text-rose-900"}`}>
                  <h4 className="font-bold mb-2 text-lg">AI Review Feedback</h4>
                  <div className="space-y-2">
                    <p><strong>Tone Alignment:</strong> {validationResult.isToneCompliant ? "✅ Pass" : "❌ Fail"}</p>
                    {validationResult.isStackCompliant !== undefined && (
                      <p><strong>Stack Constraints:</strong> {validationResult.isStackCompliant ? "✅ Pass" : "❌ Fail"}</p>
                    )}
                    <div className="mt-3 text-sm whitespace-pre-wrap">
                      {validationResult.feedback}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-ink-dark/10 bg-paper-base flex justify-between">
          <button
            onClick={() => step > 1 ? setStep((s) => s - 1 as any) : onClose()}
            className="px-6 py-2.5 text-ink-dark font-medium hover:bg-black/5 rounded-lg transition-colors flex items-center gap-2"
          >
            {step === 1 ? "Cancel" : <><ChevronLeft size={20} /> Back</>}
          </button>
          
          {step === 1 && (
            <button
              onClick={handleNextToHandoff}
              className="px-6 py-2.5 bg-sky text-white font-medium rounded-lg hover:bg-sky-dark transition-colors flex items-center gap-2 shadow-md shadow-sky/20"
            >
              Generate Prompt <ChevronRight size={20} />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-ink-dark text-white font-medium rounded-lg hover:bg-black transition-colors flex items-center gap-2"
            >
              Next: Validate Output <ChevronRight size={20} />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleValidate}
              disabled={!codeToReview.trim() || isValidating}
              className="px-6 py-2.5 bg-sky text-white font-medium rounded-lg hover:bg-sky-dark transition-colors flex items-center gap-2 shadow-md shadow-sky/20 disabled:opacity-50"
            >
              {isValidating ? <><Loader2 className="animate-spin" size={20} /> Validating...</> : <><Sparkles size={20} /> Validate Code</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
