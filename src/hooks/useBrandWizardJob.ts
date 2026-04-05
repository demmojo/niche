import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export type HexColor = string;
export type ToneEnum =
  | "Professional"
  | "Playful"
  | "Aggressive"
  | "Authoritative"
  | "Conversational";

export interface CompetitorBrand {
  id: string;
  url: string;
  visual_identity: {
    logo_url: string | null;
    colors: { primary: HexColor[]; background: HexColor[] };
    typography: { headings: string[]; body: string[] };
  };
  positioning: {
    _reasoning: string;
    personality: string;
    tone: ToneEnum[];
    target_audience: string;
  };
}

export interface BrandWizardJob {
  id?: string;
  projectId: string;
  userId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: { totalUrls: number; completed: number; failed: number };
  results?: CompetitorBrand[];
  error?: string;
}

/**
 *
 */
export function useBrandWizardJob(jobId: string | null) {
  const [job, setJob] = useState<BrandWizardJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !jobId ||
      (typeof window !== "undefined" &&
        window.location.search.includes("mock_auth=true"))
    ) {
      setJob(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const docRef = doc(db, "brand_wizard_jobs", jobId);

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (controller.signal.aborted) return;

        // ALLOW Firebase native latency compensation (hasPendingWrites)
        if (snapshot.exists()) {
          setJob({ id: snapshot.id, ...snapshot.data() } as BrandWizardJob);
        } else {
          setJob(null); // Prevent Zombie States on remote deletion
          setError("Job not found.");
        }
      },
      (err) => {
        if (controller.signal.aborted) return;
        console.error("Firestore onSnapshot error:", err);
        setError(err.message);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [jobId]);

  return { job, error };
}
