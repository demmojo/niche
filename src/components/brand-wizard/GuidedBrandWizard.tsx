import React, { useState, useTransition, useRef, useEffect } from "react";
import { CompetitorBrand, ToneEnum } from "../../hooks/useBrandWizardJob";
import {
  doc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase";
import DOMPurify from "dompurify";

/**
 *
 */
export const GuidedBrandWizard: React.FC<{
  projectId: string;
  competitors: CompetitorBrand[];
  onComplete: () => void;
}> = ({ projectId, competitors, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Selection State
  const [vibe, setVibe] = useState<ToneEnum>("Professional");
  const [primaryColor, setPrimaryColor] = useState<string>("#000000");
  const [typography, setTypography] = useState<string>("Inter");

  // Warnings
  const [warning, setWarning] = useState<string | null>(null);

  // Ref for AbortController to handle stale requests (Debounce Disaster fix)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive "Sameness" metrics locally to power AI evaluation
  const allTones = competitors.flatMap((c) => c.positioning.tone);
  const toneFrequencies = allTones.reduce(
    (acc, tone) => {
      acc[tone] = (acc[tone] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  /**
   *
   */
  const evaluateChoice = async (
    field: "vibe" | "color" | "typography",
    value: string,
  ) => {
    // Cancel any in-flight evaluation to prevent split-brain
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsEvaluating(true);
    setWarning(null);

    try {
      // Mock API call latency for evaluation
      await new Promise((res) => setTimeout(res, 600));

      if (controller.signal.aborted) return;

      let newWarning = null;
      if (
        field === "vibe" &&
        toneFrequencies[value] > competitors.length * 0.5
      ) {
        newWarning = `<strong>Tarpit Warning:</strong> ${Math.round((toneFrequencies[value] / competitors.length) * 100)}% of your competitors use a ${value} tone. You will blend into the Sea of Sameness.`;
      } else if (field === "vibe" && !toneFrequencies[value]) {
        newWarning = `<strong>Contrarian Move:</strong> None of your competitors use a ${value} tone. This is a strong differentiation opportunity.`;
      }

      // React 19 mitigation: Secondary startTransition after async await
      if (!controller.signal.aborted && newWarning) {
        startTransition(() => {
          setWarning(newWarning);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!controller.signal.aborted) {
        startTransition(() => {
          setIsEvaluating(false);
        });
      }
    }
  };

  useEffect(() => {
    evaluateChoice("vibe", vibe);
  }, [vibe]);

  /**
   *
   */
  const handleMagicButton = () => {
    startTransition(() => {
      // Find the least used tone
      const unusedTones: ToneEnum[] = [
        "Professional",
        "Playful",
        "Aggressive",
        "Authoritative",
        "Conversational",
      ];
      const bestTone = unusedTones.sort(
        (a, b) => (toneFrequencies[a] || 0) - (toneFrequencies[b] || 0),
      )[0];

      setVibe(bestTone);
      setPrimaryColor("#CCFF00"); // Bold contrarian color
      setTypography("Clash Display"); // Bold display font
      setWarning(
        `<strong>Magic Button:</strong> Auto-generated a "Blue Ocean" positioning focusing on ${bestTone} to mathematically differentiate from the cluster.`,
      );
    });
  };

  /**
   *
   */
  const handleSaveAndComplete = async () => {
    setIsEvaluating(true);
    try {
      const token = await (
        window as any
      ).firebaseAuth?.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const uid = (window as any).firebaseAuth?.currentUser?.uid;

      // Commit synthesized identity to Firestore using transaction
      const docRef = doc(db, "project_brand_identities", projectId);
      const versionId = "v1_" + Date.now().toString();
      const newVersionRef = doc(
        db,
        `project_brand_identities/${projectId}/BrandIdentityVersions`,
        versionId,
      );

      const identityData = {
        positioning: {
          personality: vibe,
          tone: [vibe],
          target_audience_niche: "TBD",
        },
        visual_identity: {
          primary_color: primaryColor,
          typography_pair: typography,
        },
      };

      await runTransaction(db, async (transaction) => {
        // Set the active version
        transaction.set(newVersionRef, {
          schemaVersion: 2,
          isActive: true,
          validFrom: serverTimestamp(),
          validTo: null,
          selected_identity: identityData,
        });

        // Set the parent document pointer
        transaction.set(
          docRef,
          {
            projectId,
            userId: uid,
            analyzed_competitors: competitors,
            activeBrandIdentityVersionId: versionId,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      });

      onComplete();
    } catch (e) {
      console.error(e);
      alert("Failed to save brand identity");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex w-full h-full min-h-[600px] bg-[#0C0C0C] text-[#F2F2F2] border border-[#333333] rounded-md overflow-hidden font-['JetBrains_Mono']">
      {/* Left Pane: Wizard Controls */}
      <div className="w-1/2 p-8 border-r border-[#333333] flex flex-col relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-['Clash_Display']">
            Brand Wizard
          </h2>
          <button
            onClick={handleMagicButton}
            className="text-xs bg-[#00B4D8]/20 text-[#00B4D8] border border-[#00B4D8] px-3 py-1 rounded hover:bg-[#00B4D8]/40 transition-colors"
          >
            ✨ Magic Button
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${step >= s ? "bg-[#CCFF00]" : "bg-[#333333]"}`}
            />
          ))}
        </div>

        {/* Step 1: Vibe */}
        {step === 1 && (
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4">
              Select your core Tone of Voice
            </h3>
            <div className="flex flex-col gap-3">
              {(
                [
                  "Professional",
                  "Playful",
                  "Aggressive",
                  "Authoritative",
                  "Conversational",
                ] as ToneEnum[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setVibe(t)}
                  className={`p-4 text-left border rounded transition-colors ${vibe === t ? "border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00]" : "border-[#333333] hover:border-[#555555]"}`}
                >
                  {t}
                  <span className="float-right text-[#888888] text-xs">
                    {Math.round(
                      ((toneFrequencies[t] || 0) /
                        Math.max(1, competitors.length)) *
                        100,
                    )}
                    % market share
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Colors */}
        {step === 2 && (
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4">
              Select your Primary Color
            </h3>
            <div className="flex gap-4">
              {["#FF2A5F", "#00B4D8", "#CCFF00", "#000000", "#FFFFFF"].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setPrimaryColor(c);
                      setWarning(null);
                    }}
                    className={`w-12 h-12 rounded-full border-2 transition-transform ${primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ),
              )}
            </div>
          </div>
        )}

        {/* Step 3: Typography */}
        {step === 3 && (
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4">Select your Typography</h3>
            <div className="flex flex-col gap-3">
              {["Inter", "Clash Display", "JetBrains Mono", "Merriweather"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setTypography(f);
                      setWarning(null);
                    }}
                    className={`p-4 text-left border rounded transition-colors ${typography === f ? "border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00]" : "border-[#333333] hover:border-[#555555]"}`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            disabled={step === 1 || isEvaluating}
            onClick={() => setStep((step - 1) as any)}
            className="px-4 py-2 border border-[#333333] rounded disabled:opacity-50"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              disabled={isEvaluating}
              onClick={() => setStep((step + 1) as any)}
              className="px-4 py-2 bg-[#F2F2F2] text-[#0C0C0C] font-bold rounded disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              disabled={isEvaluating}
              onClick={handleSaveAndComplete}
              className="px-4 py-2 bg-[#CCFF00] text-[#0C0C0C] font-bold rounded disabled:opacity-50"
            >
              Complete Fit Check
            </button>
          )}
        </div>
      </div>

      {/* Right Pane: Live Context */}
      <div className="w-1/2 bg-[#111111] p-8 relative flex flex-col justify-center items-center">
        <div className="absolute top-4 right-4 text-xs text-[#888888]">
          Live Market Context
        </div>

        {isEvaluating ? (
          <div className="animate-pulse text-[#CCFF00]">
            Evaluating market fit...
          </div>
        ) : warning ? (
          <div
            className={`p-6 border rounded shadow-lg max-w-sm ${warning.includes("Tarpit") ? "bg-[#FF2A5F]/10 border-[#FF2A5F] text-[#FF2A5F]" : "bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]"}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(warning) }}
          />
        ) : (
          <div className="text-[#888888] text-center max-w-sm">
            Make a selection to see how it contrasts with your specific market
            competitors.
          </div>
        )}

        {/* Live Preview Box */}
        <div
          className="mt-12 p-8 border border-[#333333] rounded w-full max-w-sm transition-all duration-500"
          style={{
            backgroundColor: primaryColor === "#FFFFFF" ? "#FFFFFF" : "#1A1A1A",
          }}
        >
          <h4
            className="text-2xl mb-2"
            style={{
              color: primaryColor === "#FFFFFF" ? "#000000" : primaryColor,
              fontFamily:
                typography === "Clash Display"
                  ? "Impact, sans-serif"
                  : typography,
            }}
          >
            Your Brand
          </h4>
          <p
            className={
              primaryColor === "#FFFFFF" ? "text-[#333333]" : "text-[#CCCCCC]"
            }
          >
            Tone: {vibe}
          </p>
        </div>
      </div>
    </div>
  );
};
