import fs from "fs";

let content = fs.readFileSync("src/server/campaignRoutes.ts", "utf8");

const evaluateTaxonomyEndpoint = `
// Endpoint for Hybrid Validation Pipeline (Taxonomy Merge)
campaignRouter.post(
  "/evaluate-taxonomy",
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const userId = req.user?.uid;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { featuresToMerge, customName, workspaceId } = req.body || {};
      if (!featuresToMerge || featuresToMerge.length < 2 || !customName || !workspaceId) {
        return res.status(400).json({ error: "Invalid payload." });
      }

      // We immediately send 202 Accepted, and process async.
      res.status(202).json({ status: "evaluating" });

      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is missing");
      const ai = new GoogleGenAI({ apiKey: key });
      const db = admin.firestore();

      // 1. Generate embeddings
      const embeddings: Float32Array[] = [];
      const modelName = "text-embedding-004";
      for (const feature of featuresToMerge) {
        const embedRes = await ai.models.embedContent({
          model: modelName,
          contents: feature,
        });
        const vals = embedRes.embeddings?.[0]?.values;
        if (!vals) throw new Error("Failed to embed feature");
        const floatArr = new Float32Array(vals);
        fastL2NormalizeInPlace(floatArr);
        embeddings.push(floatArr);
      }

      // 2. Compute similarity (average pairwise)
      let totalSim = 0;
      let pairs = 0;
      for (let i = 0; i < embeddings.length; i++) {
        for (let j = i + 1; j < embeddings.length; j++) {
          totalSim += calculateCosineSimilarity(embeddings[i], embeddings[j]);
          pairs++;
        }
      }
      const avgSim = totalSim / pairs;
      
      const thresholds = getTaxonomyThresholds(modelName);
      
      let decision: "objective" | "subjective" | "borderline" = "borderline";
      if (avgSim >= thresholds.objective) decision = "objective";
      else if (avgSim < thresholds.subjective) decision = "subjective";

      if (decision === "borderline") {
        // LLM as a judge with exponential backoff
        let llmDecision = "subjective"; // fallback
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const prompt = \`Are these features functionally identical (objective synonyms) or just subjectively grouped?
Features to merge: \${JSON.stringify(featuresToMerge)}
Proposed new name: \${customName}

Provide chain-of-thought reasoning with keys: reasoning_feature_a, reasoning_feature_b, boundary_analysis.
Then provide classification: OBJECTIVE_SYNONYM or SUBJECTIVE_GROUPING.
Also provide confidence (0-1). Make sure the output is pure JSON matching this exact structure:
{
  "reasoning_feature_a": string,
  "reasoning_feature_b": string,
  "boundary_analysis": string,
  "classification": "OBJECTIVE_SYNONYM" | "SUBJECTIVE_GROUPING",
  "confidence": number
}\`;
            const geminiRes = await ai.models.generateContent({
              model: "gemini-3.1-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              },
            });
            const responseText = geminiRes.text;
            if (responseText) {
              const parsed = JSON.parse(responseText);
              if (parsed.classification === "OBJECTIVE_SYNONYM" && parsed.confidence >= 0.90) {
                llmDecision = "objective";
              }
              break; // success
            }
          } catch (e) {
            console.warn(\`LLM judge attempt \${attempt + 1} failed\`, e);
            await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          }
        }
        if (llmDecision === "objective") decision = "objective";
        else decision = "subjective";
      }

      // 3. Handle outcomes
      const userTaxRef = db.doc(\`workspaces/\${workspaceId}/appData/taxonomy\`);
      
      if (decision === "objective") {
        // Queue for Superadmin
        const proposalRef = db.collection("taxonomy_proposals").doc();
        await proposalRef.set({
          customName,
          featuresToMerge,
          workspaceId,
          similarityScore: avgSim,
          status: "pending_superadmin",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // For ALL outcomes, we approve the local merge so the user's optimistic UI solidifies
      await db.runTransaction(async (t) => {
        const snap = await t.get(userTaxRef);
        if (!snap.exists) return;
        const data = snap.data();
        if (data?.evaluationStatus === "evaluating") {
          t.update(userTaxRef, {
            evaluationStatus: "success"
          });
        }
      });
      
    } catch (e: any) {
      console.error("Evaluate taxonomy failed:", e);
      // Even on failure, set it to success/idle locally to not break user's flow
      try {
         const { workspaceId } = req.body || {};
         if (workspaceId) {
            const userTaxRef = admin.firestore().doc(\`workspaces/\${workspaceId}/appData/taxonomy\`);
            await userTaxRef.update({ evaluationStatus: "success" });
         }
      } catch(ignore) {}
    }
  }
);
`;

fs.writeFileSync(
  "src/server/campaignRoutes.ts",
  content + "\n" + evaluateTaxonomyEndpoint,
);
