import { useState, useEffect, useOptimistic, startTransition } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

const WORKSPACE_ID = "nicheai-workspace"; // Consistent with App.tsx

export interface TaxonomyAlias {
  id: string; // The merged custom name
  originalFeatures: string[];
}

export interface TaxonomyDocument {
  approvedTaxonomy: TaxonomyAlias[];
  shadowTaxonomy?: TaxonomyAlias[];
  evaluationStatus: 'idle' | 'evaluating' | 'failed' | 'success';
}

/**
 *
 */
export function useTaxonomySync(): {
  displayTaxonomy: TaxonomyAlias[];
  evaluationStatus: TaxonomyDocument['evaluationStatus'];
  mergeFeatures: (featuresToMerge: string[], customName: string) => void;
} {
  const [docState, setDocState] = useState<TaxonomyDocument>({
    approvedTaxonomy: [],
    evaluationStatus: 'idle',
  });

  useEffect(() => {
    // Skip remote sync if demo mode is active
    if (window.location.search.includes("demo_data=true")) {
      return;
    }

    const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", "taxonomy");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDocState(docSnap.data() as TaxonomyDocument);
      }
    });

    return () => unsubscribe();
  }, []);

  const currentDisplayTaxonomy = 
    docState.evaluationStatus === 'evaluating' && docState.shadowTaxonomy
      ? docState.shadowTaxonomy
      : docState.approvedTaxonomy;

  const [optimisticTaxonomy, dispatchOptimistic] = useOptimistic<TaxonomyAlias[], { type: 'merge', featuresToMerge: string[], customName: string }>(
    currentDisplayTaxonomy,
    (current, action) => {
      if (action.type === 'merge') {
        const newTaxonomy = [...current];
        // Remove or merge overlaps
        newTaxonomy.push({
          id: action.customName,
          originalFeatures: action.featuresToMerge
        });
        return newTaxonomy;
      }
      return current;
    }
  );

  /**
   *
   */
  const mergeFeatures = (featuresToMerge: string[], customName: string) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'merge', featuresToMerge, customName });

      try {
        const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", "taxonomy");
        
        await runTransaction(db, async (transaction) => {
          const docSnap = await transaction.get(docRef);
          
          let currentTax = [];
          if (docSnap.exists()) {
            const data = docSnap.data() as TaxonomyDocument;
            currentTax = data.approvedTaxonomy || [];
          }

          const newShadow = [...currentTax, {
            id: customName,
            originalFeatures: featuresToMerge
          }];

          transaction.set(docRef, {
            approvedTaxonomy: currentTax,
            shadowTaxonomy: newShadow,
            evaluationStatus: 'evaluating'
          });
        });
        
        // Next, an async server/Cloud Function should pick this up!
        // We can trigger an API endpoint since we don't have real cloud functions configured
        fetch('/api/campaign/evaluate-taxonomy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featuresToMerge, customName, workspaceId: WORKSPACE_ID })
        }).catch(e => console.error("Validation trigger failed", e));
        
      } catch (err) {
        console.error("Merge transaction failed", err);
      }
    });
  };

  return {
    displayTaxonomy: optimisticTaxonomy,
    evaluationStatus: docState.evaluationStatus,
    mergeFeatures,
  };
}
