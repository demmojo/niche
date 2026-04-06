import React, { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { signInAnonymously } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { TrustBuilderScreen } from "./TrustBuilderScreen";
import { URLTeaserScreen, type TeaserData } from "./URLTeaserScreen";
import { isMockAuthEnabled } from "../utils/testEnv";
import { useIsMounted } from "../hooks/useIsMounted";
import { Button } from "./ui/Button";
import { safeSessionStorageGet, safeSessionStorageSet } from "../utils/storage";

type EntryStep = "intent" | "input" | "analyzing" | "success" | "error";
type IntentType = "validate" | "discover" | "analyze" | "url" | null;
type PersonaType = "solo_founder" | "enterprise_pm" | null;

export interface IdeaPayload {
  url?: string;
  productName?: string;
  productDescription?: string;
}

export interface CompletePayload {
  name: string;
  description: string;
  targetRegions: string[];
  features: unknown[];
  strategy: unknown[];
  jobId: string | null;
  visibility: string;
}

function IntentButton({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none hover:border-ink-dark transition-colors shadow-sm text-ink-dark font-medium text-left flex justify-between items-center"
    >
      <div>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-ink-dark/60 mt-1">
          {description}
        </span>
      </div>
      <span className="text-ink-dark/40">→</span>
    </button>
  );
}

function EntryActionButtons({
  onBack,
  isAuthenticating,
  submitLabel,
}: {
  onBack: () => void;
  isAuthenticating: boolean;
  submitLabel: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = isAuthenticating || pending;

  return (
    <div className="mt-8 flex justify-between w-full">
      <button
        type="button"
        onClick={onBack}
        disabled={isDisabled}
        className="px-6 py-2 text-ink-dark/60 hover:text-ink-dark font-medium transition-colors disabled:opacity-50"
      >
        ← Back
      </button>
      <Button
        type="submit"
        isPending={pending || isAuthenticating}
        loadingText={
          isAuthenticating ? "Initializing engine..." : "Processing..."
        }
        className="px-8 py-3 bg-ink-dark text-white rounded-xl font-bold hover:bg-black shadow-md"
      >
        {submitLabel}
      </Button>
    </div>
  );
}

import { cn } from "../lib/utils";

function InlineInput({
  name,
  label,
  placeholder,
  defaultValue,
  widthClass,
  isAuthenticating,
  autoFocus,
  hasError,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  widthClass: string;
  isAuthenticating: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
}) {
  return (
    <>
      <label className="sm:hidden text-sm font-bold text-ink-dark/60 uppercase tracking-wider mb-[-8px] mt-2">
        {label}
      </label>
      <input
        type="text"
        name={name}
        aria-label={label}
        aria-invalid={hasError ? "true" : undefined}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={cn(
          "block sm:inline-block w-full sm:text-center border-b-2 outline-none bg-transparent placeholder:text-ink-dark/30 transition-colors sm:px-2 py-1 sm:mx-2",
          widthClass,
          hasError
            ? "border-rose-500 focus:border-rose-600 text-rose-900 bg-rose-50/50"
            : "border-slate-200 focus:border-ink-dark text-ink-dark",
        )}
        required
        disabled={isAuthenticating}
        autoFocus={autoFocus}
      />
    </>
  );
}

export function ZeroFrictionEntry({
  onComplete,
  onIntentSelected,
  onLoginClick,
}: {
  onComplete: (product: CompletePayload) => void;
  onIntentSelected?: () => void;
  onLoginClick?: () => void;
}) {
  const [step, setStep] = useState<EntryStep>("intent");
  const [intent, setIntent] = useState<IntentType>(null);
  const [persona, setPersona] = useState<PersonaType>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaPayload, setIdeaPayload] = useState<IdeaPayload | null>(null);
  const [pivotedIdea, setPivotedIdea] = useState<string | null>(null);
  const [originalIdea, setOriginalIdea] = useState<string | null>(null);
  const [tarpitData, setTarpitData] = useState<{
    isTarpit: boolean;
    reason: string;
  } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [formDataCache, setFormDataCache] = useState<{
    category?: string;
    audience?: string;
    problem?: string;
    channel?: string;
    idea?: string;
  }>(() => {
    try {
      const cached = safeSessionStorageGet("zf_form_data");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {};
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});

  const isMounted = useIsMounted();

  const ensureAnonymousUser = async (selectedPersona?: PersonaType) => {
    let user = auth.currentUser;
    if (!user) {
      if (isMockAuthEnabled()) {
        console.log("Bypassing auth in test environment.");
      } else {
        setIsAuthenticating(true);
        let timeoutId: ReturnType<typeof setTimeout>;
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Auth timeout circuit breaker tripped")),
              5000,
            );
          });
          const cred = await Promise.race([
            signInAnonymously(auth),
            timeoutPromise,
          ]);
          user = cred.user;
        } finally {
          if (timeoutId!) {
            clearTimeout(timeoutId);
          }
          if (isMounted.current) {
            setIsAuthenticating(false);
          }
        }
      }
    }

    if (user && selectedPersona && !isMockAuthEnabled()) {
      if (!isMounted.current) return;
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { persona: selectedPersona },
          { merge: true },
        );
      } catch (e) {
        console.error("Failed to set persona:", e);
      }
    }
  };

  const handleIntentSelection = async (selectedIntent: IntentType) => {
    setIntent(selectedIntent);
    setErrorMessage("");
    setErrorMessage("");

    let selectedPersona: PersonaType = "solo_founder";
    if (selectedIntent === "analyze") {
      selectedPersona = "enterprise_pm";
    }
    setPersona(selectedPersona);
    if (onIntentSelected) onIntentSelected();

    try {
      await ensureAnonymousUser(selectedPersona);
    } catch (e: unknown) {
      console.error("Failed to sign in anonymously and set persona:", e);
      // We don't block the UI here, fallback to proceeding
    }

    setStep("input");
  };

  const handleAction = async (formData: FormData) => {
    let inputValue = formData.get("idea") as string;
    setFormErrors({});
    let hasError = false;
    let newErrors: { [key: string]: boolean } = {};

    if (intent === "validate") {
      const category = formData.get("category") as string;
      const audience = formData.get("audience") as string;
      const problem = formData.get("problem") as string;
      const channel = formData.get("channel") as string;

      if (!category) {
        newErrors.category = true;
        hasError = true;
      }
      if (!audience) {
        newErrors.audience = true;
        hasError = true;
      }
      if (!problem) {
        newErrors.problem = true;
        hasError = true;
      }
      if (!channel) {
        newErrors.channel = true;
        hasError = true;
      }

      const newCache = {
        ...formDataCache,
        category,
        audience,
        problem,
        channel,
      };
      setFormDataCache(newCache);
      safeSessionStorageSet("zf_form_data", JSON.stringify(newCache));

      if (category && audience && problem && channel) {
        inputValue = `I want to build a ${category} for ${audience} that solves ${problem}, reaching them through ${channel}.`;
      }
    } else {
      if (!inputValue) {
        newErrors.idea = true;
        hasError = true;
      }
      const newCache = { ...formDataCache, idea: inputValue };
      setFormDataCache(newCache);
      safeSessionStorageSet("zf_form_data", JSON.stringify(newCache));
    }

    if (hasError || !inputValue) {
      setStep("error");
      setErrorMessage("Please fill out all required fields.");
      setFormErrors(newErrors);
      return;
    }

    let finalIdea = inputValue;
    if (intent === "analyze") {
      finalIdea = `I want to analyze gaps left by ${inputValue}.`;
    }

    try {
      await ensureAnonymousUser();
      if (!isMounted.current) return;

      if (intent === "url") {
        setIdeaPayload({
          url: finalIdea,
        });
      } else if (intent === "analyze") {
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
    } catch (e: unknown) {
      console.error(e);
      if (!isMounted.current) return;
      setStep("error");

      let errorMsg = "Failed to sign in.";
      if (e instanceof Error) {
        errorMsg = e.message;
        if ("code" in e && typeof (e as any).code === "string") {
          const code = (e as any).code;
          if (
            code === "auth/api-key-not-valid" ||
            errorMsg.includes("mock-api-key")
          ) {
            errorMsg =
              "Firebase API Key is missing or invalid. Please add VITE_FIREBASE_API_KEY to your .env.local file.";
          } else if (
            code === "auth/operation-not-allowed" ||
            errorMsg.includes("auth/operation-not-allowed")
          ) {
            errorMsg =
              "Anonymous Authentication is not enabled. Please enable it in your Firebase Console (Authentication > Sign-in method).";
          }
        }
      }
      setErrorMessage(errorMsg);
    }
  };

  const handleValidationComplete = (
    data: {
      isTarpit?: boolean;
      suggestedNiches?: string[];
      tarpitReason?: string;
    },
    currentPayload: IdeaPayload,
  ) => {
    let finalIdea = currentPayload.productDescription || "";
    setOriginalIdea(finalIdea);
    if (
      data.isTarpit &&
      data.suggestedNiches &&
      data.suggestedNiches.length > 0
    ) {
      finalIdea = data.suggestedNiches[0];
      setTarpitData({
        isTarpit: true,
        reason:
          data.tarpitReason ||
          "We found heavy competition and low differentiation in your original concept.",
      });
    } else {
      setTarpitData({ isTarpit: false, reason: "" });
    }
    setPivotedIdea(finalIdea);
    setStep("success");
  };

  if (step === "analyzing" && ideaPayload) {
    const handleCancel = () => {
      setStep("intent");
      setIdeaPayload(null);
    };

    if (intent === "url" && ideaPayload.url) {
      return (
        <URLTeaserScreen
          url={ideaPayload.url}
          onCancel={handleCancel}
          onComplete={(data: TeaserData) => {
            let finalIdea = ideaPayload.url!;
            if (data.orthogonal_pivots && data.orthogonal_pivots.length > 0) {
              finalIdea = data.orthogonal_pivots[0];
            }
            setPivotedIdea(finalIdea);
            setStep("success");
          }}
        />
      );
    }
    return (
      <TrustBuilderScreen
        ideaPayload={ideaPayload}
        onCancel={handleCancel}
        onComplete={(data) => handleValidationComplete(data, ideaPayload)}
      />
    );
  }

  if (step === "success" && pivotedIdea) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED]">
        <div className="w-full max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-ink-dark mb-6">
            {tarpitData?.isTarpit
              ? "Tarpit Detected: Pivot Recommended"
              : "Your Validated Idea"}
          </h2>

          {tarpitData?.isTarpit && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 mb-6 text-left text-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="font-bold block mb-1">
                Your Idea: {originalIdea}
              </span>
              {tarpitData.reason}
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-ink-dark/10 mb-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
            {tarpitData?.isTarpit && (
              <div className="text-xs font-bold text-ink-dark/40 uppercase mb-2">
                Suggested Alternate Niche
              </div>
            )}
            <p className="text-xl text-ink-dark leading-relaxed">
              {pivotedIdea}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            {tarpitData?.isTarpit && (
              <Button
                isPending={isProceeding}
                onClick={async () => {
                  setIsProceeding(true);
                  try {
                    await Promise.resolve(
                      onComplete({
                        name: "My Original Idea",
                        description: originalIdea || "",
                        targetRegions: ["Global"],
                        features: [],
                        strategy: [],
                        jobId: null,
                        visibility: "shared",
                      }),
                    );
                  } finally {
                    setIsProceeding(false);
                  }
                }}
                className="px-6 py-3 text-ink-dark bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                Proceed with Original Idea
              </Button>
            )}
            <Button
              isPending={isProceeding}
              loadingText="Connecting to Canvas..."
              onClick={async () => {
                setIsProceeding(true);
                try {
                  await Promise.resolve(
                    onComplete({
                      name: "My AI Idea",
                      description: pivotedIdea,
                      targetRegions: ["Global"],
                      features: [],
                      strategy: [],
                      jobId: null,
                      visibility: "shared",
                    }),
                  );
                } finally {
                  setIsProceeding(false);
                }
              }}
              className="px-8 py-4 bg-ink-dark text-white rounded-xl font-bold text-lg hover:bg-black shadow-lg w-full sm:w-auto"
            >
              {tarpitData?.isTarpit
                ? "Proceed with Pivot"
                : "Enter Strategy Canvas"}
            </Button>
          </div>

          <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
            <button
              disabled={isProceeding}
              onClick={() => {
                setStep("input");
                setPivotedIdea(null);
                setOriginalIdea(null);
                setTarpitData(null);
              }}
              className="px-4 py-2 text-ink-dark/60 hover:text-ink-dark font-medium transition-colors disabled:opacity-50 text-sm"
            >
              Edit my inputs
            </button>
            <button
              disabled={isProceeding}
              onClick={() => {
                setStep("intent");
                setPivotedIdea(null);
                setOriginalIdea(null);
                setTarpitData(null);
                setFormDataCache({});
              }}
              className="px-4 py-2 text-ink-dark/60 hover:text-ink-dark font-medium transition-colors disabled:opacity-50 text-sm ml-4"
            >
              Start Over
            </button>
          </div>
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
            <IntentButton
              title="I'm a Founder"
              description="Validate a startup idea or pivot"
              onClick={() => handleIntentSelection("validate")}
            />
            <IntentButton
              title="I'm a Product Manager"
              description="Analyze a market or competitor"
              onClick={() => handleIntentSelection("analyze")}
            />
            <IntentButton
              title="I have a Website"
              description="Extract and pivot from a URL"
              onClick={() => handleIntentSelection("url")}
            />

            <div className="mt-6 text-sm text-ink-dark/60">
              Already have an account?{" "}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (onLoginClick) onLoginClick();
                }}
                className="font-bold underline hover:text-ink-dark transition-colors"
              >
                Log in
              </button>
            </div>
          </div>
        )}

        {(step === "input" || step === "error") && intent === "validate" && (
          <form
            action={handleAction}
            className="w-full relative animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-8 rounded-2xl shadow-xl border border-slate-200"
          >
            <div className="flex flex-col sm:block text-lg sm:text-2xl text-ink-dark leading-loose font-medium text-left gap-4 sm:gap-0">
              <span className="sm:inline hidden">I want to build a </span>
              <InlineInput
                name="category"
                label="Product Category"
                placeholder="Category (e.g. CRM)"
                defaultValue={formDataCache.category}
                widthClass="sm:w-48"
                isAuthenticating={isAuthenticating}
                autoFocus
                hasError={formErrors.category}
              />
              <span className="sm:inline hidden"> for </span>
              <InlineInput
                name="audience"
                label="Target Audience"
                placeholder="Audience (e.g. Plumbers)"
                defaultValue={formDataCache.audience}
                widthClass="sm:w-64"
                isAuthenticating={isAuthenticating}
                hasError={formErrors.audience}
              />
              <span className="sm:inline hidden"> that solves </span>
              <InlineInput
                name="problem"
                label="Core Problem"
                placeholder="Problem (e.g. scheduling)"
                defaultValue={formDataCache.problem}
                widthClass="sm:w-64"
                isAuthenticating={isAuthenticating}
                hasError={formErrors.problem}
              />
              <span className="sm:inline hidden">, reaching them through </span>
              <InlineInput
                name="channel"
                label="Distribution Channel"
                placeholder="Channel (e.g. cold email)"
                defaultValue={formDataCache.channel}
                widthClass="sm:w-64"
                isAuthenticating={isAuthenticating}
                hasError={formErrors.channel}
              />
              <span className="sm:inline hidden">.</span>
            </div>

            {step === "error" && (
              <p
                className="text-rose-500 mt-6 font-medium text-center"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            <EntryActionButtons
              onBack={() => setStep("intent")}
              isAuthenticating={isAuthenticating}
              submitLabel="Validate Niche"
            />
          </form>
        )}

        {(step === "input" || step === "error") && intent !== "validate" && (
          <form
            action={handleAction}
            className="w-full relative animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <input
              type="text"
              name="idea"
              aria-label={
                intent === "analyze"
                  ? "Competitor or market to analyze"
                  : "Website URL"
              }
              aria-invalid={formErrors.idea ? "true" : undefined}
              placeholder={
                intent === "analyze"
                  ? "Which competitor or market do you want to analyze?"
                  : "Paste a website URL (e.g. https://...)"
              }
              defaultValue={formDataCache.idea}
              className={cn(
                "w-full text-2xl p-6 border-2 rounded-2xl outline-none transition-colors shadow-xl placeholder:text-ink-dark/30 text-ink-dark disabled:opacity-50",
                formErrors.idea
                  ? "border-rose-500 focus:border-rose-600 bg-rose-50/50"
                  : "bg-white border-slate-200 focus:border-ink-dark",
              )}
              autoFocus
              required
              disabled={isAuthenticating}
            />
            {step === "error" && (
              <p
                className="text-rose-500 mt-4 font-medium text-left"
                role="alert"
              >
                {errorMessage}
              </p>
            )}
            <EntryActionButtons
              onBack={() => setStep("intent")}
              isAuthenticating={isAuthenticating}
              submitLabel={intent === "analyze" ? "Analyze" : "Extract URL"}
            />
          </form>
        )}
      </div>
    </div>
  );
}
