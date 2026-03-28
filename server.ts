import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Apollo.io Enrichment API (Organization Search)
  app.post("/api/apollo/enrich", async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const apiKey = process.env.APOLLO_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "APOLLO_API_KEY is not configured" });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`https://api.apollo.io/v1/organizations/enrich?domain=${domain}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apollo API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Apollo API Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch data from Apollo" });
    }
  });

  app.post("/api/apollo/search", async (req, res) => {
    try {
      const { keywords } = req.body;
      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: "Keywords array is required" });
      }

      const apiKey = process.env.APOLLO_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "APOLLO_API_KEY is not configured" });
      }

      const response = await fetch(`https://api.apollo.io/v1/organizations/search`, {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          organization_locations: ["United States"],
          q_organization_keyword_tags: keywords,
          per_page: 5
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apollo API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Apollo API Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch data from Apollo search" });
    }
  });

  // Apollo.io News API (News Articles Search)
  app.post("/api/apollo/news", async (req, res) => {
    try {
      const { organization_ids } = req.body;
      
      if (!organization_ids || !organization_ids.length) {
        return res.status(400).json({ error: "organization_ids is required" });
      }

      const apiKey = process.env.APOLLO_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "APOLLO_API_KEY is not configured" });
      }
      
      const params = new URLSearchParams();
      organization_ids.forEach((id: string) => params.append('organization_ids[]', id));
      params.append('per_page', '5');

      const response = await fetch(`https://api.apollo.io/v1/news_articles/search?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apollo news error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Apollo News API Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch news from Apollo" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// Export for tests
export const appPromise = startServer();
