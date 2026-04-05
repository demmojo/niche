import React, { useState, useEffect } from "react";
import { MyProductData } from "../../components/MyProduct";
import { validateArtifactTone } from "../../utils/artifactReviewer";
import {
  PromptConfig,
  generateSystemPrompt,
} from "../../utils/promptAssembler";
import { useProjectBrandIdentity } from "../../hooks/useProjectBrandIdentity";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

interface StrategyToCodeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  productData: MyProductData;
  projectId: string;
}

/**
 *
 */
export const StrategyToCodeWizard: React.FC<StrategyToCodeWizardProps> = ({
  isOpen,
  onClose,
  productData,
  projectId,
}) => {
  const brandState = useProjectBrandIdentity(projectId);
  const brandIdentity =
    brandState.status === "success" ? brandState.data : null;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<PromptConfig>({
    scope: "component",
    techStack: "react-tailwind",
    contextLevel: "creative",
    enforceBrand: true,
  });

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [pastedCode, setPastedCode] = useState("");
  const [reviewJobId, setReviewJobId] = useState<string | null>(null);
  const [proposedUpdate, setProposedUpdate] = useState<any>(null);
  const STATE_IDLE = "idle";
  const STATE_MUTATING = "mutating";
  const STATE_SNAPSHOT_RECEIVED = "snapshot_received";
  const STATE_ERROR = "error";

  const [validationState, setValidationState] = useState<string>(STATE_IDLE);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!reviewJobId) return;

    const unsub = onSnapshot(doc(db, "ReviewJobs", reviewJobId), (docSnap) => {
      const data = docSnap.data();
      if (!data) return;

      if (data.status === "completed") {
        setProposedUpdate(data.result);
        setValidationState(STATE_SNAPSHOT_RECEIVED);
      } else if (data.status === "failed") {
        setErrorMessage("Validation failed: " + data.error);
        setValidationState(STATE_ERROR);
        setReviewJobId(null);
      }
    });

    return () => unsub();
  }, [reviewJobId]);

  /**
   *
   */
  const handleValidate = async () => {
    if (!pastedCode || !brandIdentity) return;
    setValidationState(STATE_MUTATING);
    setErrorMessage("");
    setProposedUpdate(null);

    try {
      // Compress the payload via browser's CompressionStream API
      const stream = new Blob([pastedCode]).stream();
      const compressedStream = stream.pipeThrough(
        new CompressionStream("gzip"),
      );
      const compressedBlob = await new Response(compressedStream).blob();
      const compressedBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        /**
         *
         */
        reader.onloadend = () =>
          resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(compressedBlob);
      });

      const res = await fetch("/api/brand-review/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          code: compressedBase64,
          isCompressed: true,
          baseVersionId: brandIdentity.id,
          brandTone: brandIdentity.tone,
        }),
      });

      if (!res.ok) throw new Error("Failed to start review job");
      const data = await res.json();

      // If snapshot somehow already beat us to setting state, ignore
      setReviewJobId((prevId) => {
        if (validationState === STATE_SNAPSHOT_RECEIVED) return prevId;
        return data.jobId;
      });
    } catch (e: any) {
      setErrorMessage(e.message);
      setValidationState(STATE_ERROR);
    }
  };

  /**
   *
   */
  const handleApproveUpdate = async () => {
    if (!proposedUpdate || !brandIdentity) return;

    try {
      await runTransaction(db, async (transaction) => {
        const currentBrandRef = doc(db, "project_brand_identities", projectId);
        const currentBrandSnap = await transaction.get(currentBrandRef);
        const currentData = currentBrandSnap.data();

        if (
          currentData?.activeBrandIdentityVersionId !==
          proposedUpdate.baseVersionId
        ) {
          throw new Error(
            "Conflict: The brand identity was updated elsewhere. Please refresh and review.",
          );
        }

        const newVersionId = "v2_" + Date.now().toString();
        const oldVersionRef = doc(
          db,
          `project_brand_identities/${projectId}/BrandIdentityVersions`,
          proposedUpdate.baseVersionId,
        );
        const newVersionRef = doc(
          db,
          `project_brand_identities/${projectId}/BrandIdentityVersions`,
          newVersionId,
        );

        // Close old
        transaction.set(
          oldVersionRef,
          { isActive: false, validTo: serverTimestamp() },
          { merge: true },
        );

        // Append new
        const newPrimaryColor =
          proposedUpdate.proposedUpdate.newColors?.[0] ||
          brandIdentity.primary_color;

        transaction.set(newVersionRef, {
          schemaVersion: 2,
          isActive: true,
          validFrom: serverTimestamp(),
          validTo: null,
          selected_identity: {
            positioning: brandIdentity.selected_identity?.positioning || {
              personality: "Professional",
              tone: ["Professional"],
              target_audience_niche: "TBD",
            },
            visual_identity: {
              primary_color: newPrimaryColor,
              typography_pair: brandIdentity.typography,
            },
          },
          extracted_tokens: proposedUpdate.proposedUpdate,
        });

        // Update pointer
        transaction.set(
          currentBrandRef,
          { activeBrandIdentityVersionId: newVersionId },
          { merge: true },
        );
      });

      alert("Brand updated successfully!");
      setProposedUpdate(null);
      setReviewJobId(null);
      onClose();
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    }
  };

  if (!isOpen) return null;

  /**
   *
   */
  const handleNext = () => {
    if (step === 1) {
      setGeneratedPrompt(
        generateSystemPrompt(productData, config, brandIdentity),
      );
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  /**
   *
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#0C0C0C] border border-[#333333] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col text-[#F2F2F2] font-['JetBrains_Mono'] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#333333]">
          <h2 className="text-xl font-bold font-['Clash_Display']">
            Rapid PDLC Workflow
          </h2>
          <button onClick={onClose} className="text-[#888888] hover:text-white">
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="flex p-6 gap-2">
          <div
            className={`flex-1 h-1 rounded ${step >= 1 ? "bg-[#CCFF00]" : "bg-[#333333]"}`}
          />
          <div
            className={`flex-1 h-1 rounded ${step >= 2 ? "bg-[#CCFF00]" : "bg-[#333333]"}`}
          />
          <div
            className={`flex-1 h-1 rounded ${step >= 3 ? "bg-[#CCFF00]" : "bg-[#333333]"}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Step 1: Configuration</h3>

              <div>
                <label className="block text-sm mb-2 text-[#888888]">
                  Tech Stack
                </label>
                <select
                  value={config.techStack}
                  onChange={(e) =>
                    setConfig({ ...config, techStack: e.target.value as any })
                  }
                  className="w-full bg-[#1A1A1A] border border-[#333333] p-3 rounded"
                >
                  <option value="react-tailwind">React + Tailwind</option>
                  <option value="vue">Vue 3</option>
                  <option value="svelte">Svelte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#888888]">
                  Enforce Brand Identity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.enforceBrand}
                    onChange={(e) =>
                      setConfig({ ...config, enforceBrand: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#CCFF00]"
                  />
                  <span className="text-sm">
                    Inject ProjectBrandIdentity (Colors, Fonts, Tone)
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="text-lg font-bold">Step 2: Handoff</h3>
              <p className="text-sm text-[#888888]">
                Copy this highly optimized CO-STAR prompt into v0.dev or
                Bolt.new.
              </p>

              <div className="relative flex-1">
                <textarea
                  readOnly
                  value={generatedPrompt}
                  className="w-full h-full bg-[#1A1A1A] border border-[#333333] p-4 rounded text-sm font-mono text-[#CCCCCC] resize-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 bg-[#333333] hover:bg-[#444444] text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {copied ? "Copied! 🚀" : "Copy to Clipboard"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="text-lg font-bold">
                Step 3: Loop-Back Validation
              </h3>
              <p className="text-sm text-[#888888]">
                Paste the generated code from v0.dev here to validate it against
                your product strategy and brand guidelines.
              </p>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder="<code_to_review>..."
                className="w-full flex-1 bg-[#1A1A1A] border border-[#333333] p-4 rounded text-sm font-mono text-[#CCCCCC]"
              />

              {!proposedUpdate ? (
                <button
                  onClick={handleValidate}
                  disabled={validationState === STATE_MUTATING || !pastedCode}
                  className="bg-[#CCFF00] text-[#0C0C0C] font-bold py-3 rounded hover:bg-[#B3E600] disabled:opacity-50"
                  aria-live="polite"
                >
                  {validationState === STATE_MUTATING
                    ? "Validating Code..."
                    : "Run AI Validation"}
                </button>
              ) : (
                <div className="bg-[#1A1A1A] border border-[#333333] p-4 rounded text-sm space-y-3">
                  <h4 className="font-bold text-[#CCFF00]">
                    Proposed Brand Update
                  </h4>
                  <p>{proposedUpdate.proposedUpdate.feedback}</p>
                  {proposedUpdate.proposedUpdate.newColors?.length > 0 && (
                    <div className="flex gap-2">
                      <span>New Colors:</span>
                      {proposedUpdate.proposedUpdate.newColors.map(
                        (c: string) => (
                          <div
                            key={c}
                            className="w-5 h-5 rounded-full border"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ),
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleApproveUpdate}
                    className="mt-4 w-full bg-[#00B4D8] text-white font-bold py-2 rounded hover:bg-[#0090AD]"
                  >
                    Approve & Update Brand
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-[#333333]">
          <button
            onClick={() => (step > 1 ? setStep((step - 1) as any) : onClose())}
            className="px-6 py-2 border border-[#333333] rounded hover:bg-[#1A1A1A] transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 3 && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-[#F2F2F2] text-[#0C0C0C] font-bold rounded hover:bg-white transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
