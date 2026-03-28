import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Update Apollo Enrich fetch to use retry
enrich_fetch_old = """                const apolloRes = await fetch("/api/apollo/enrich", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ domain }),
                });

                if (apolloRes.status === 429) {
                  const error: any = new Error(
                    "Rate limit exceeded for Apollo API",
                  );
                  error.isRateLimit = true;
                  error.message =
                    (customApiKey
                      ? "RateLimit:CustomKey:"
                      : "RateLimit:GlobalKey:") + error.message;
                  throw error;
                }"""

enrich_fetch_new = """                let apolloRes: Response | null = null;
                for (let attempt = 0; attempt < 2; attempt++) {
                  try {
                    apolloRes = await fetch("/api/apollo/enrich", {
                      method: "POST",
                      headers,
                      body: JSON.stringify({ domain }),
                    });
                    
                    if (apolloRes.status === 429) {
                      const error: any = new Error("Rate limit exceeded for Apollo API");
                      error.isRateLimit = true;
                      error.message = (customApiKey ? "RateLimit:CustomKey:" : "RateLimit:GlobalKey:") + error.message;
                      throw error;
                    }

                    if (apolloRes.ok || (apolloRes.status >= 400 && apolloRes.status < 500)) {
                      break;
                    }
                    
                    if (attempt < 1) {
                      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 200));
                    }
                  } catch (e: any) {
                    if (e.isRateLimit || attempt === 1) throw e;
                    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 200));
                  }
                }
                
                if (!apolloRes) throw new Error("Fetch failed after retries");"""

content = content.replace(enrich_fetch_old, enrich_fetch_new)

# Update log messages
log_old = """                    details:
                      "Could not fetch Apollo data for " +
                      domain +
                      " (Status: " +
                      apolloRes.status +
                      "). Skipping enrichment.","""
log_new = """                    details:
                      "Could not fetch competitor data for " +
                      domain +
                      ". Skipping enrichment.","""
content = content.replace(log_old, log_new)


# Update Apollo News fetch to use retry
news_fetch_old = """                  const newsRes = await fetch("/api/apollo/news", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ organization_ids: [orgId] }),
                  });

                  if (newsRes.status === 429) {
                    const error: any = new Error(
                      "Rate limit exceeded for Apollo API",
                    );
                    error.isRateLimit = true;
                    error.message =
                      (customApiKey
                        ? "RateLimit:CustomKey:"
                        : "RateLimit:GlobalKey:") + error.message;
                    throw error;
                  }"""

news_fetch_new = """                  let newsRes: Response | null = null;
                  for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                      newsRes = await fetch("/api/apollo/news", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ organization_ids: [orgId] }),
                      });

                      if (newsRes.status === 429) {
                        const error: any = new Error("Rate limit exceeded for Apollo API");
                        error.isRateLimit = true;
                        error.message = (customApiKey ? "RateLimit:CustomKey:" : "RateLimit:GlobalKey:") + error.message;
                        throw error;
                      }

                      if (newsRes.ok || (newsRes.status >= 400 && newsRes.status < 500)) {
                        break;
                      }

                      if (attempt < 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 200));
                      }
                    } catch (e: any) {
                      if (e.isRateLimit || attempt === 1) throw e;
                      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 200));
                    }
                  }
                  
                  if (!newsRes) throw new Error("Fetch failed after retries");"""

content = content.replace(news_fetch_old, news_fetch_new)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
