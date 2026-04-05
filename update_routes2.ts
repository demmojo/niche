import fs from "fs";

let content = fs.readFileSync("src/server/scoringRoutes.ts", "utf8");

const findString = `
      // Emit Gaps State
      sendData("gap_analysis", llmParsed.market_gaps);

      if (isAnonymous) {
        sendData("pql_gate", true);
        return;
      }

      // 3. Prepare initial Tarpit Score
      const vectorUniqueness = 1.0 - (llmParsed.wedge_metric ?? 0.5);
      const apolloCount = 120; // Defaulting for synchronous check
`;

const replaceString = `
      // Emit Gaps State
      if (!isResumed) {
        sendData("gap_analysis", llmParsed.market_gaps);
      }

      if (isAnonymous) {
        // Cache intermediate state to Firestore for stateful resume
        const db = admin.firestore();
        await db.collection("pqlState").doc(req.user.uid).set({
          productDescription,
          competitor_count: exaResponse.results?.length || 0,
          opportunityScore: oppScore,
          wedge_metric: llmParsed.wedge_metric ?? 0.5,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        sendData("pql_gate", true);
        return;
      }

      // 3. Prepare initial Tarpit Score
      const vectorUniqueness = 1.0 - (llmParsed.wedge_metric ?? 0.5);
      const apolloCount = 120; // Defaulting for synchronous check
`;

content = content.replace(findString, replaceString);

const startFindString = `
      const exa = new Exa(exaApiKey);
      const exaQuery = \`Competitors to \${productName}: \${productDescription}\`;

      if (abortController.signal.aborted) throw new Error("AbortError");
      // Exa fetch
      let exaTextLimit = 1000;
`;

const startReplaceString = `
      const db = admin.firestore();
      let cachedState: any = null;
      let isResumed = false;

      // If they are not anonymous, check if they are resuming an old session
      if (!isAnonymous) {
        const stateRef = db.collection("pqlState").doc(req.user.uid);
        const stateSnap = await stateRef.get();
        if (stateSnap.exists) {
          const data = stateSnap.data();
          if (data && data.productDescription === productDescription) {
             cachedState = data;
             isResumed = true;
             // Send immediate pre-computed states to bypass latency
             sendData("competitor_count", cachedState.competitor_count);
             // Assume they saw JTBD and gaps, so we skip directly to Tarpit Score
             // Clean up the cache so they don't resume infinitely if they change descriptions
             await stateRef.delete();
          }
        }
      }

      const exa = new Exa(exaApiKey);
      const exaQuery = \`Competitors to \${productName}: \${productDescription}\`;

      if (abortController.signal.aborted) throw new Error("AbortError");
      
      let exaTextLimit = 1000;
`;

content = content.replace(startFindString, startReplaceString);

const llmFindString = `      // Send competitor count immediately
      sendData("competitor_count", exaResponse.results?.length || 0);

      const competitorContext = exaResponse.results
        .slice(0, 3)
        .map((r: any) => \`URL: \${r.url}\\nContent: \${r.text || r.title || ""}\`)
        .join("\\n\\n");

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        sendData("error", "GEMINI_API_KEY is not configured");
        return res.end();
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // 2. Strict LLM JSON Parsing with _reasoning
      const prompt = \`
Analyze the following product concept and the retrieved competitor data.
Product Name: \${productName}
Description: \${productDescription}

Competitors:
\${competitorContext}

Determine if this product idea is a defensible niche or a highly saturated horizontal tarpit.
Extract the reasoning, a verbatim exact quote from the competitor context that proves saturation or niche viability, the corresponding URL, and a wedge metric (0 to 1, where 1 is highly saturated, 0 is highly unique). If the idea is a tarpit, provide an array of 3 hyper-niche pivot suggestions (suggestedNiches) that are much more defensible.
    \`;

      const callOptions = {
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: LLMExtractionSchema.toJSONSchema() as any,
          systemInstruction:
            "You are an expert M&A due diligence AI. Analyze the competitor saturation.",
        },
      };

      if (abortController.signal.aborted) throw new Error("AbortError");
      const geminiRes = await ai.models.generateContent(callOptions);
      const llmOutputRaw = geminiRes.text;
      if (!llmOutputRaw) throw new Error("Empty response from LLM");

      let llmParsed;
      try {
        llmParsed = LLMExtractionSchema.parse(JSON.parse(llmOutputRaw));
      } catch (parseError: any) {
        throw parseError;
      }

      const { calculateOpportunityScore } =
        await import("../utils/scoringEngine");
      const oppScore = calculateOpportunityScore(
        llmParsed.jtbd.importance,
        llmParsed.jtbd.satisfaction,
      );

      // Emit JTBD State
      sendData("jtbd_analysis", {
        job: llmParsed.jtbd.job_statement,
        opportunityScore: oppScore,
      });`;

const llmReplaceString = `      let llmParsed: any = {};
      let oppScore = 0;
      let ai;

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        sendData("error", "GEMINI_API_KEY is not configured");
        return res.end();
      }
      ai = new GoogleGenAI({ apiKey: geminiApiKey });

      if (isResumed && cachedState) {
         // Skip Exa and extraction, use cached state
         oppScore = cachedState.opportunityScore;
         llmParsed.wedge_metric = cachedState.wedge_metric;
         // Give it empty ones for the required schema so typescript passes
         llmParsed.market_gaps = [];
         llmParsed._reasoning = "Resumed from cached analysis.";
         llmParsed.exact_quote = "";
         llmParsed.exa_url = "";
      } else {
        // Send competitor count immediately
        sendData("competitor_count", exaResponse.results?.length || 0);

        const competitorContext = exaResponse.results
          .slice(0, 3)
          .map((r: any) => \`URL: \${r.url}\\nContent: \${r.text || r.title || ""}\`)
          .join("\\n\\n");

        // 2. Strict LLM JSON Parsing with _reasoning
        const prompt = \`
Analyze the following product concept and the retrieved competitor data.
Product Name: \${productName}
Description: \${productDescription}

Competitors:
\${competitorContext}

Determine if this product idea is a defensible niche or a highly saturated horizontal tarpit.
Extract the reasoning, a verbatim exact quote from the competitor context that proves saturation or niche viability, the corresponding URL, and a wedge metric (0 to 1, where 1 is highly saturated, 0 is highly unique). If the idea is a tarpit, provide an array of 3 hyper-niche pivot suggestions (suggestedNiches) that are much more defensible.
      \`;

        const callOptions = {
          model: selectedModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: LLMExtractionSchema.toJSONSchema() as any,
            systemInstruction:
              "You are an expert M&A due diligence AI. Analyze the competitor saturation.",
          },
        };

        if (abortController.signal.aborted) throw new Error("AbortError");
        const geminiRes = await ai.models.generateContent(callOptions);
        const llmOutputRaw = geminiRes.text;
        if (!llmOutputRaw) throw new Error("Empty response from LLM");

        try {
          llmParsed = LLMExtractionSchema.parse(JSON.parse(llmOutputRaw));
        } catch (parseError: any) {
          throw parseError;
        }

        const { calculateOpportunityScore } =
          await import("../utils/scoringEngine");
        oppScore = calculateOpportunityScore(
          llmParsed.jtbd.importance,
          llmParsed.jtbd.satisfaction,
        );

        // Emit JTBD State
        sendData("jtbd_analysis", {
          job: llmParsed.jtbd.job_statement,
          opportunityScore: oppScore,
        });
      }`;

content = content.replace(llmFindString, llmReplaceString);

fs.writeFileSync("src/server/scoringRoutes.ts", content);
