import React, { useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { TrustBuilderScreen } from "./TrustBuilderScreen";

type EntryStep = "intent" | "input" | "analyzing" | "success" | "error";
type IntentType = "validate" | "discover" | "analyze" | "url" | null;
type PersonaType = "solo_founder" | "enterprise_pm" | null;

export function ZeroFrictionEntry({
  onComplete,
  onIntentSelected,
}: {
  onComplete: (product: any) => void;
  onIntentSelected?: () => void;
}) {
  const [step, setStep] = useState<EntryStep>("intent");
  const [intent, setIntent] = useState<IntentType>(null);
  const [persona, setPersona] = useState<PersonaType>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaPayload, setIdeaPayload] = useState<any>(null);
  const [pivotedIdea, setPivotedIdea] = useState<string | null>(null);

  const handleIntentSelection = async (selectedIntent: IntentType) => {
    setIntent(selectedIntent);

    let selectedPersona: PersonaType = "solo_founder";
    if (selectedIntent === "analyze") {
      selectedPersona = "enterprise_pm";
    }
    setPersona(selectedPersona);
    if (onIntentSelected) onIntentSelected();

    try {
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }

      if (user) {
        await setDoc(
          doc(db, "users", user.uid),
          { persona: selectedPersona },
          { merge: true },
        );
      }
    } catch (e: any) {
      console.error("Failed to sign in anonymously and set persona:", e);
      // We don't block the UI here, fallback to proceeding
    }

    setStep("input");
  };

  const handleAction = async (formData: FormData) => {
    const inputValue = formData.get("idea") as string;
    if (!inputValue) {
      setStep("error");
      setErrorMessage("Please enter some text.");
      return;
    }

    // Adjust payload based on intent
    let finalIdea = inputValue;
    if (intent === "analyze") {
      finalIdea = `I want to analyze gaps left by ${inputValue}.`;
    }

    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      if (intent === "analyze") {
        setIdeaPayload({
          productName: "Competitor Analysis",
          productDescription: finalIdea,
        });
      } else {
        setIdeaPayload({
          productName: "AI Idea",
          productDescription: finalIdea,
        });
      }
      setStep("analyzing");
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
              <div>
                <span className="block font-bold">I'm a Founder</span>
                <span className="block text-sm text-ink-dark/60 mt-1">
                  Validate a startup idea or pivot
                </span>
              </div>
              <span className="text-ink-dark/40">→</span>
            </button>
            <button
              onClick={() => handleIntentSelection("analyze")}
              className="w-full text-xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none hover:border-ink-dark transition-colors shadow-sm text-ink-dark font-medium text-left flex justify-between items-center"
            >
              <div>
                <span className="block font-bold">I'm a Product Manager</span>
                <span className="block text-sm text-ink-dark/60 mt-1">
                  Analyze a market or competitor
                </span>
              </div>
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
                  : "Which competitor or market do you want to analyze?"
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
