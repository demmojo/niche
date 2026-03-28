import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Update Stage 1: Apollo Search
stage1_new = """
    // --- STAGE 1: Discover New Competitors ---
    if (startStage <= 1) {
      try {
        const discoverLogId = addLog('Market Discovery', 'Scanning for new competitors...', 'pending');
        const knownNames = competitors.map(c => c.name).join(', ');
        
        let apolloDomains: string[] = [];
        try {
          const keywords = myProductData.features.map(f => f.name).concat([myProductData.name]).filter(Boolean);
          if (keywords.length > 0) {
            const apolloSearchRes = await fetch('/api/apollo/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keywords })
            });
            if (apolloSearchRes.ok) {
              const apolloSearchData = await apolloSearchRes.json();
              if (apolloSearchData.organizations) {
                apolloDomains = apolloSearchData.organizations.map((org: any) => org.website_url?.replace(/^https?:\/\//, '').split('/')[0]).filter(Boolean);
              }
            }
          }
        } catch(err) {
          console.warn("Apollo search failed, falling back to LLM", err);
        }

        const response = await withKeyRotation(async (ai, model) => {
          return await ai.models.generateContent({
            model: model,
            contents: `Based on these known competitors in the space of ${myProductData.name || 'this industry'}: ` + knownNames + `. Identify up to 5 emerging or lesser-known competitors that are NOT in this list. Return ONLY a JSON array of their website domains (e.g. ["example.com", "test.io"]).`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          });
        });
        const llmDomains = JSON.parse(response.text || '[]');
        newCompetitorDomains = [...new Set([...apolloDomains, ...llmDomains])];

        updateLog(discoverLogId, { 
          details: 'Discovered ' + newCompetitorDomains.length + ' potential new competitors.', 
          status: 'success', 
          contextData: newCompetitorDomains,
          apiCallDetails: { prompt: 'Discover new competitors', response: newCompetitorDomains }
        });
      } catch (e: any) {
        console.warn("Discovery failed", e);
        const errorMsg = getErrorMessage(e);
        updateLog(logId, { details: 'Market discovery failed: ' + errorMsg + '. Try again.', status: 'error', retryAction: () => handleGlobalSync(1, { newCompetitorDomains, apolloData, searchData }) });
        setIsSyncing(false);
        addToast(errorMsg, 'error');
        removeToast(toastId);
        return;
      }
      setActiveTasks(prev => prev.map(t => t.id === '1' ? { ...t, progress: 100 } : t));
    }
"""

content = re.sub(
    r"// --- STAGE 1: Discover New Competitors ---[\s\S]*?(?=// --- STAGE 2: Apollo Enrichment ---)",
    stage1_new.strip() + "\n\n    ",
    content
)


# Update Stage 3: Google Search
stage3_new = """
    // --- STAGE 3: Google Search ---
    if (startStage <= 3) {
      try {
        const searchQueries = [
          `${myProductData.name || 'SaaS'} market trends ${new Date().getFullYear()}`,
          ...competitors.slice(0, 2).map(c => c.name + ' news OR pricing OR features')
        ];

        await Promise.all(searchQueries.map(async (query, i) => {
          const googleLogId = addLog('Google Search', 'Searching: "' + query + '"...', 'pending');
          try {
            // First use custom search API to get raw links
            let rawResults = '';
            try {
              const customSearchRes = await fetch('/api/google/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
              });
              if (customSearchRes.ok) {
                const customSearchData = await customSearchRes.json();
                if (customSearchData.items && customSearchData.items.length > 0) {
                  rawResults = customSearchData.items.map((item: any) => `[${item.title}](${item.link}): ${item.snippet}`).join('\\n');
                  
                  const newSource: DataSource = {
                    id: 'src-google-' + Date.now() + '-' + i,
                    competitorId: competitors.find(c => query.includes(c.name))?.id || 'unknown',
                    type: 'news',
                    sourceUrl: customSearchData.items[0].link,
                    excerpt: rawResults,
                    timestamp: new Date().toISOString(),
                    tags: ['news', 'google-search', 'market-trends'],
                    confidenceLevel: 'High',
                    isDeduced: false,
                    source: 'Google Search'
                  };
                  setRawDataSources(prev => [newSource, ...prev]);
                }
              }
            } catch(e) {
               console.warn("Google custom search failed", e);
            }

            const response = await withKeyRotation(async (ai, model) => {
              return await ai.models.generateContent({
                model: model,
                contents: `Search the web for: ${query}. Provide a brief summary of the top results. Include these raw results if helpful: ${rawResults}`,
                config: {
                  tools: [{ googleSearch: {} }],
                },
              });
            });
            
            const summary = response.text || 'No summary generated.';
            searchData.push({ query, summary, rawResults });
            
            const newSource: DataSource = {
              id: 'src-search-' + Date.now() + '-' + i,
              competitorId: competitors.find(c => query.includes(c.name))?.id || 'unknown',
              type: 'website',
              sourceUrl: 'google.com/search?q=' + encodeURIComponent(query),
              excerpt: summary,
              timestamp: new Date().toISOString(),
              tags: ['search', 'market-research'],
              confidenceLevel: 'Medium',
              isDeduced: true,
              source: 'AI'
            };
            
            setRawDataSources(prev => [newSource, ...prev]);
            
            updateLog(googleLogId, { details: 'Successfully searched: "' + query + '".', status: 'success', contextData: { summary, rawResults }, apiCallDetails: { query, tool: 'googleSearch' } });
          } catch (e: any) {
            updateLog(googleLogId, { details: 'Search failed for "' + query + '".', status: 'error', apiCallDetails: { error: e.message } });
          }
          
          setActiveTasks(prev => prev.map(t => t.id === '3' ? { ...t, progress: ((i + 1) / searchQueries.length) * 100 } : t));
        }));
      } catch (e: any) {
        console.warn("Search stage failed", e);
        const errorMsg = getErrorMessage(e);
        updateLog(logId, { details: 'Market search failed: ' + errorMsg + '. Try again.', status: 'error', retryAction: () => handleGlobalSync(3, { newCompetitorDomains, apolloData, searchData }) });
        setIsSyncing(false);
        addToast(errorMsg, 'error');
        removeToast(toastId);
        return;
      }
      setActiveTasks(prev => prev.map(t => t.id === '3' ? { ...t, progress: 100 } : t));
    }
"""

content = re.sub(
    r"// --- STAGE 3: Google Search ---[\s\S]*?(?=// --- STAGE 4: Synthesize Competitors ---)",
    stage3_new.strip() + "\n\n    ",
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

