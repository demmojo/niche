import React, { useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { TrustBuilderScreen } from "./TrustBuilderScreen";

type EntryStep = "intent" | "input" | "analyzing" | "success" | "error";
type IntentType = "validate" | "discover" | "analyze" | null;

export function ZeroFrictionEntry({
  onComplete,
}: {
  onComplete: (product: any) => void;
}) {
  const [step, setStep] = useState<EntryStep>("intent");
  const [intent, setIntent] = useState<IntentType>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaPayload, setIdeaPayload] = useState<any>(null);
  const [pivotedIdea, setPivotedIdea] = useState<string | null>(null);

  const handleIntentSelection = (selectedIntent: IntentType) => {
    setIntent(selectedIntent);
    setStep("input");
  };

  const handleAction = async (formData: FormData) => {
    const inputValue = formData.get("idea") as string;
    if (!inputValue) {
      setStep("error");
      setErrorMessage("Please enter some text.");
      return;
    }

    setStep("analyzing");

    // Adjust payload based on intent
    let finalIdea = inputValue;
    if (intent === "discover") {
      finalIdea = `I want to discover a niche in the ${inputValue} industry.`;
    } else if (intent === "analyze") {
      finalIdea = `I want to analyze gaps left by ${inputValue}.`;
    }

    setIdeaPayload({ productName: "AI Idea", productDescription: finalIdea });

    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e: any) {
      console.error(e);
      setStep("error");
      setErrorMessage(e.message || "Failed to sign in.");
    }
  };

  const handleValidationComplete = (data: any, currentPayload: any) => {
    let finalIdea = currentPayload.productDescription;
    if (
      data.isTarpit &&
      data.suggestedNiches &&
      data.suggestedNiches.length > 0
    ) {
      finalIdea = data.suggestedNiches[0];
    }
    setPivotedIdea(finalIdea);
    setStep("success");
  };

  if (step === "analyzing" && ideaPayload) {
    return (
      <TrustBuilderScreen
        ideaPayload={ideaPayload}
        onComplete={(data) => handleValidationComplete(data, ideaPayload)}
      />
    );
  }

  if (step === "success" && pivotedIdea) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED]">
        <div className="w-full max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-ink-dark mb-6">
            Your Validated Idea
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-ink-dark/10 mb-8 text-left">
            <p className="text-xl text-ink-dark leading-relaxed">
              {pivotedIdea}
            </p>
          </div>
          <button
            onClick={() => {
              onComplete({
                name: "My AI Idea",
                description: pivotedIdea,
                targetRegions: ["Global"],
                features: [],
                strategy: [],
                jobId: null,
                visibility: "shared",
              });
            }}
            className="px-8 py-4 bg-ink-dark text-white rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg"
          >
            Generate Full Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED]">
      <div className="w-full max-w-2xl px-4 text-center">
        <h1 className="text-4xl font-serif font-bold text-ink-dark mb-12">
          NicheAI
        </h1>

        {step === "intent" && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-serif font-bold text-ink-dark/80 mb-6">
              What is your primary goal today?
            </h2>
            <button
              onClick={() => handleIntentSelection("validate")}
              className="w-full text-xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none hover:border-ink-dark transition-colors shadow-sm text-ink-dark font-medium text-left flex justify-between items-center"
            >
              <span>Validate an existing idea</span>
              <span className="text-ink-dark/40">→</span>
            </button>
            <button
              onClick={() => handleIntentSelection("discover")}
              className="w-full text-xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none hover:border-ink-dark transition-colors shadow-sm text-ink-dark font-medium text-left flex justify-between items-center"
            >
              <span>Discover a new niche</span>
              <span className="text-ink-dark/40">→</span>
            </button>
            <button
              onClick={() => handleIntentSelection("analyze")}
              className="w-full text-xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none hover:border-ink-dark transition-colors shadow-sm text-ink-dark font-medium text-left flex justify-between items-center"
            >
              <span>Analyze a market gap</span>
              <span className="text-ink-dark/40">→</span>
            </button>
          </div>
        )}

        {(step === "input" || step === "error") && (
          <form
            action={handleAction}
            onSubmit={(e) => {
              e.preventDefault();
              handleAction(new FormData(e.currentTarget));
            }}
            className="w-full relative animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <input
              type="text"
              name="idea"
              placeholder={
                intent === "validate"
                  ? "What are you thinking of building?"
                  : intent === "discover"
                    ? "What industry or topic interests you?"
                    : "Which competitor do you want to analyze?"
              }
              className="w-full text-2xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none focus:border-ink-dark transition-colors shadow-xl placeholder:text-ink-dark/30 text-ink-dark"
              autoFocus
              required
            />
            {step === "error" && (
              <p className="text-rose-500 mt-4 font-medium" role="alert">
                {errorMessage}
              </p>
            )}
            <button type="submit" className="hidden">
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
