import React, { useActionState, useOptimistic } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase"; // Adjust to your config
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";

type EntryState = {
  status: "idle" | "analyzing" | "success" | "error";
  message: string;
  pivotedIdea?: string;
};

const initialState: EntryState = { status: "idle", message: "" };

export function ZeroFrictionEntry({
  onComplete,
}: {
  onComplete: (product: any) => void;
}) {
  // 1. The Server/Async Action
  // This executes in the background while the UI shows the optimistic state
  async function processIdeaAction(
    prevState: EntryState,
    formData: FormData,
  ): Promise<EntryState> {
    const idea = formData.get("idea") as string;
    if (!idea) return { status: "error", message: "Please enter an idea." };

    try {
      // Step A: Authenticate the user if not already
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      // Step B: Hit the backend/LLM to process the idea
      const token = await auth.currentUser?.getIdToken();

      const res = await fetchWithAppCheck("/api/scoring/tarpit-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: "AI Idea",
          productDescription: idea,
        }),
      });

      const resText = await res
        .clone()
        .text()
        .catch(() => "");
      // #region agent log
      fetch(
        "http://127.0.0.1:7755/ingest/98d2df09-f5ab-4d4c-9948-722cbac3f53f",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "2190e2",
          },
          body: JSON.stringify({
            sessionId: "2190e2",
            runId: "post-fix",
            hypothesisId: "H1",
            location: "ZeroFrictionEntry.tsx:fetch",
            message: "fetch response",
            data: { status: res.status, ok: res.ok, bodyText: resText },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion

      if (!res.ok) {
        throw new Error("Failed to analyze idea.");
      }

      const data = await res.json();
      let pivotedIdea = idea;
      if (
        data.isTarpit &&
        data.suggestedNiches &&
        data.suggestedNiches.length > 0
      ) {
        pivotedIdea = data.suggestedNiches[0];
      }

      return { status: "success", message: "Analysis complete!", pivotedIdea };
    } catch (error: any) {
      console.error(error);
      return {
        status: "error",
        message: error.message || "Failed to process idea. Please try again.",
      };
    }
  }

  // 2. Manage the async lifecycle natively
  const [state, dispatchAction, isPending] = useActionState(
    processIdeaAction,
    initialState,
  );

  // 3. Manage the instant UI feedback
  const [optimisticState, setOptimisticState] = useOptimistic<
    EntryState,
    EntryState
  >(state, (currentState, optimisticValue) => optimisticValue);

  // 4. Form Action Wrapper
  const handleAction = (formData: FormData) => {
    // Instantly transition the UI to the Explainable State
    // This masks the delay of both Firebase Auth and the Data Fetch
    setOptimisticState({
      status: "analyzing",
      message: "Analyzing market saturation...",
    });

    // Dispatch the actual background process
    dispatchAction(formData);
  };

  // 5. Render Explainable States (acting as our highly-converting loading UI)
  if (optimisticState.status === "analyzing" || isPending) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED]"
        aria-live="polite"
        aria-busy="true"
      >
        <h2 className="text-2xl font-bold animate-pulse text-ink-dark">
          {optimisticState.message}
        </h2>
        <span className="mt-4 text-sm text-ink-dark/60">
          Pivoting away from tarpits...
        </span>
      </div>
    );
  }

  if (state.status === "success" && state.pivotedIdea) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED]">
        <div className="w-full max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-ink-dark mb-6">
            Your Validated Idea
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-ink-dark/10 mb-8 text-left">
            <p className="text-xl text-ink-dark leading-relaxed">
              {state.pivotedIdea}
            </p>
          </div>
          <button
            onClick={() => {
              onComplete({
                name: "My AI Idea",
                description: state.pivotedIdea,
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

  // 6. Render the single, high-converting text input
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED]">
      <div className="w-full max-w-2xl px-4 text-center">
        <h1 className="text-4xl font-serif font-bold text-ink-dark mb-12">
          NicheAI
        </h1>
        <form action={handleAction} className="w-full relative">
          <input
            type="text"
            name="idea"
            placeholder="What are you thinking of building?"
            className="w-full text-2xl p-6 bg-white border-2 border-ink-dark/20 rounded-2xl outline-none focus:border-ink-dark transition-colors shadow-xl placeholder:text-ink-dark/30 text-ink-dark"
            disabled={isPending}
            autoFocus
            required
          />
          {optimisticState.status === "error" && (
            <p className="text-rose-500 mt-4 font-medium" role="alert">
              {optimisticState.message}
            </p>
          )}
          <button type="submit" className="hidden">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
