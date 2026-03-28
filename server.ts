import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import {
  calculateExactHash,
  calculateSimHash,
  simHashDistance,
  generateEmbedding,
  supabase,
} from "./src/utils/hashing";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const extractRateLimitHeaders = (response: any) => {
    const rateLimitHeaders: Record<string, string> = {};
    if (response?.headers?.entries) {
      for (const [key, value] of response.headers.entries()) {
        if (
          key.toLowerCase().includes("rate-limit") ||
          key.toLowerCase().includes("ratelimit")
        ) {
          rateLimitHeaders[key] = value;
        }
      }
    } else if (response?.headers?.forEach) {
      response.headers.forEach((value: string, key: string) => {
        if (
          key.toLowerCase().includes("rate-limit") ||
          key.toLowerCase().includes("ratelimit")
        ) {
          rateLimitHeaders[key] = value;
        }
      });
    } else if (response?.headers && typeof response.headers === "object") {
      for (const key in response.headers) {
        if (
          key.toLowerCase().includes("rate-limit") ||
          key.toLowerCase().includes("ratelimit")
        ) {
          rateLimitHeaders[key] = response.headers[key];
        }
      }
    }
    return rateLimitHeaders;
  };

  // Federated Mentions Search API
  app.get("/api/search/mentions", async (req, res) => {
    try {
      const { q, limit_per_category } = req.query;
      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ error: "Query parameter 'q' is required" });
      }

      const limit = limit_per_category
        ? parseInt(limit_per_category as string, 10)
        : 3;

      const { data, error } = await supabase.rpc("global_search", {
        search_query: q,
        limit_per_category: limit,
      });

      if (error) throw error;

      // Group the data by category
      const grouped: Record<string, { results: any[]; hasMore: boolean }> = {};

      if (data) {
        data.forEach((item: any) => {
          if (!grouped[item.type]) {
            grouped[item.type] = { results: [], hasMore: false };
          }
          grouped[item.type].results.push(item);
        });

        // Check if there are more results (if we got exactly 'limit' results, assume hasMore=true)
        Object.keys(grouped).forEach((type) => {
          if (grouped[type].results.length === limit) {
            grouped[type].hasMore = true;
          }
        });
      }

      res.json(grouped);
    } catch (error: any) {
      console.error("Search API Error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to perform federated search" });
    }
  });

  // Raw Data Ingestion API
  app.post("/api/raw-data/ingest", async (req, res) => {
    try {
      const { payload, data_type, metadata } = req.body;

      if (!payload || !data_type) {
        return res
          .status(400)
          .json({ error: "Payload and data_type are required" });
      }

      // 1. Calculate Hashes
      const exactHash = calculateExactHash(payload);
      let simHash = null;
      let pHash = null; // Placeholder for image perceptual hash
      let embedding = null;

      if (
        data_type === "markdown" ||
        data_type === "text" ||
        data_type === "html"
      ) {
        // Assuming payload is string for text types
        simHash = calculateSimHash(String(payload));
        // embedding = await generateEmbedding(String(payload)); // Disable mock embedding for now to speed up testing
      }

      // 2. Check for exact match first
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from("raw_data_versions")
        .select("asset_id, logical_asset_id")
        .eq("exact_hash", exactHash)
        .limit(1);

      if (exactMatchError) throw exactMatchError;

      if (exactMatch && exactMatch.length > 0) {
        // Exact match found. Discard or just log.
        return res.status(200).json({
          status: "discarded",
          reason: "exact_match",
          logical_asset_id: exactMatch[0].logical_asset_id,
        });
      }

      // 3. Check for near match (SimHash) if text
      if (simHash && data_type === "markdown") {
        // Basic SimHash comparison. In production, you'd likely load candidates based on chunks of the SimHash
        // and then calculate distance in memory, or use a custom Postgres function.
        // For this demo, we'll fetch recent records and compare (Not scalable for millions of rows without specialized indexing)
        const { data: candidates, error: candidateError } = await supabase
          .from("raw_data_versions")
          .select("perceptual_hash, logical_asset_id")
          .eq("data_type", "markdown")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!candidateError && candidates) {
          for (const candidate of candidates) {
            if (candidate.perceptual_hash) {
              const distance = simHashDistance(
                simHash,
                candidate.perceptual_hash,
              );
              if (distance <= 3) {
                // Threshold for "near duplicate"
                // Push to inbox
                const { data: inboxEntry, error: inboxError } = await supabase
                  .from("raw_data_inbox")
                  .insert({
                    pending_data_type: data_type,
                    pending_blob_uri: "temp_s3_uri", // Would actually upload to S3 first
                    pending_exact_hash: exactHash,
                    pending_perceptual_hash: simHash,
                    pending_extracted_metadata: metadata || {},
                    matched_logical_asset_id: candidate.logical_asset_id,
                    similarity_score: distance,
                  })
                  .select();

                if (inboxError) throw inboxError;

                return res.status(202).json({
                  status: "pending_approval",
                  reason: "near_match",
                  inbox_id: inboxEntry[0].id,
                });
              }
            }
          }
        }
      }

      // 4. No matches found, insert as new asset
      // 4a. Upload to Storage (Mocked here)
      const blobUri = `s3://mock-bucket/raw/${Date.now()}.bin`;

      // 4b. Insert Asset
      const { data: assetData, error: assetError } = await supabase
        .from("raw_data_assets")
        .insert({
          data_type:
            data_type === "markdown"
              ? "markdown"
              : data_type === "json"
                ? "json"
                : "image",
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // 4c. Insert Version
      const { data: versionData, error: versionError } = await supabase
        .from("raw_data_versions")
        .insert({
          asset_id: assetData.id,
          logical_asset_id: assetData.logical_asset_id,
          blob_uri: blobUri,
          exact_hash: exactHash,
          perceptual_hash: simHash || pHash,
          extracted_metadata: metadata || {},
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // 4d. Update Asset Pointer
      await supabase
        .from("raw_data_assets")
        .update({ current_version_id: versionData.id })
        .eq("id", assetData.id);

      res.status(201).json({
        status: "created",
        logical_asset_id: assetData.logical_asset_id,
        version_id: versionData.id,
      });
    } catch (error: any) {
      console.error("Ingestion Error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to ingest raw data" });
    }
  });

  // Apollo.io Enrichment API (Organization Search)
  app.post("/api/apollo/enrich", async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const clientApiKey = req.headers["x-api-key"] as string;
      const apiKey = clientApiKey || process.env.APOLLO_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "APOLLO_API_KEY is not configured" });
      }

      let response: Response | undefined;
      let errorText = "";

      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          response = await fetch(
            `https://api.apollo.io/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
            {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
              signal: controller.signal,
            },
          );
          clearTimeout(timeoutId);

          if (response.ok) break;

          errorText = await response.text();
          if (response.status === 429 || response.status >= 500) {
            if (attempt === 1) {
              const delay = 1000 + Math.random() * 500;
              await new Promise((res) => setTimeout(res, delay));
              continue;
            }
          } else {
            break; // Don't retry 400s
          }
        } catch (e: any) {
          clearTimeout(timeoutId);
          if (attempt === 1) {
            const delay = 1000 + Math.random() * 500;
            await new Promise((res) => setTimeout(res, delay));
            continue;
          }
          throw e;
        }
      }

      if (!response) {
        throw new Error("Failed to execute request after retries");
      }

      // Forward rate limit headers
      const rateLimits = extractRateLimitHeaders(response);
      Object.entries(rateLimits).forEach(([key, value]) =>
        res.setHeader(key, value),
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Apollo API error: ${response.status} ${errorText}`,
          responseStatus: response.status,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Apollo API Error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch data from Apollo" });
    }
  });

  app.post("/api/apollo/search", async (req, res) => {
    try {
      const { keywords } = req.body;
      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: "Keywords array is required" });
      }

      const clientApiKey = req.headers["x-api-key"] as string;
      const apiKey = clientApiKey || process.env.APOLLO_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "APOLLO_API_KEY is not configured" });
      }

      let response: Response | undefined;
      let errorText = "";

      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          response = await fetch(
            `https://api.apollo.io/v1/organizations/search`,
            {
              method: "POST",
              headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
              signal: controller.signal,
              body: JSON.stringify({
                organization_locations: ["United States"],
                q_organization_keyword_tags: keywords,
                per_page: 5,
              }),
            },
          );
          clearTimeout(timeoutId);

          if (response.ok) break;

          errorText = await response.text();
          if (response.status === 429 || response.status >= 500) {
            if (attempt === 1) {
              const delay = 1000 + Math.random() * 500;
              await new Promise((res) => setTimeout(res, delay));
              continue;
            }
          } else {
            break; // Don't retry 400s
          }
        } catch (e: any) {
          clearTimeout(timeoutId);
          if (attempt === 1) {
            const delay = 1000 + Math.random() * 500;
            await new Promise((res) => setTimeout(res, delay));
            continue;
          }
          throw e;
        }
      }

      if (!response) {
        throw new Error("Failed to execute request after retries");
      }

      // Forward rate limit headers
      const rateLimits = extractRateLimitHeaders(response);
      Object.entries(rateLimits).forEach(([key, value]) =>
        res.setHeader(key, value),
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Apollo API error: ${response.status} ${errorText}`,
          responseStatus: response.status,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Apollo API Error:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch data from Apollo search",
      });
    }
  });

  // Apollo.io News API (News Articles Search)
  app.post("/api/apollo/news", async (req, res) => {
    try {
      const { organization_ids } = req.body;

      if (!organization_ids || !organization_ids.length) {
        return res.status(400).json({ error: "organization_ids is required" });
      }

      const clientApiKey = req.headers["x-api-key"] as string;
      const apiKey = clientApiKey || process.env.APOLLO_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "APOLLO_API_KEY is not configured" });
      }

      const params = new URLSearchParams();
      organization_ids.forEach((id: string) =>
        params.append("organization_ids[]", id),
      );
      params.append("per_page", "5");

      let response: Response | undefined;
      let errorText = "";

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch(
            `https://api.apollo.io/v1/news_articles/search?${params.toString()}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
            },
          );

          if (response.ok) break;

          errorText = await response.text();
          if (response.status === 429 || response.status >= 500) {
            if (attempt === 1) {
              const delay = 1000 + Math.random() * 500;
              await new Promise((res) => setTimeout(res, delay));
              continue;
            }
          } else {
            break; // Don't retry 400s
          }
        } catch (e: any) {
          if (attempt === 1) {
            const delay = 1000 + Math.random() * 500;
            await new Promise((res) => setTimeout(res, delay));
            continue;
          }
          throw e;
        }
      }

      if (!response) {
        throw new Error("Failed to execute news request after retries");
      }

      // Forward rate limit headers
      const rateLimits = extractRateLimitHeaders(response);
      Object.entries(rateLimits).forEach(([key, value]) =>
        res.setHeader(key, value),
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Apollo news error: ${response.status} ${errorText}`,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Apollo News API Error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch news from Apollo" });
    }
  });

  // Vite middleware for development
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NODE_ENV !== "test"
  ) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// Export for tests
export const appPromise = startServer();
