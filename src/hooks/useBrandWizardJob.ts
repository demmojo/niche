import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export type HexColor = string;
export type ToneEnum = "Professional" | "Playful" | "Aggressive" | "Authoritative" | "Conversational";

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
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }

    const docRef = doc(db, "brand_wizard_jobs", jobId);
    
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        // Prevent optimistic UI split-brain issues by ignoring snapshot if there are pending local writes
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        if (snapshot.exists()) {
          setJob({ id: snapshot.id, ...snapshot.data() } as BrandWizardJob);
        } else {
          setError("Job not found.");
        }
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  return { job, error };
}
