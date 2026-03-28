## Why

To remain competitive, NicheAI needs to provide continuous, automated market intelligence on competitor activities, updates, and market shifts. Currently, users lack an automated pipeline to monitor competitor PR, blog posts, and news mentions in real-time. By implementing a "News Article Search" feature, NicheAI can proactively extract critical intelligence—such as new features, product launches, funding rounds, emerging threats, and new use cases or regions.

## What Changes

Introduce a "News Article Search" orchestration pipeline that leverages Gemini API as the foundational reasoning layer, augmented by specialized search APIs like Exa and Apollo.io.

- **Gemini Foundational Reasoning**: Gemini will serve as the core intelligence engine, synthesizing raw search results, extracting structured insights (threats, new products, feature updates), and applying Google Search Grounding for broad, general knowledge queries.
- **Exa API Integration**: Implement Exa API's `auto` search capabilities with `category: "news"` and `category: "company"` to perform high-quality, targeted crawls. We will utilize Exa's `auto` search type (to preserve free tier credits and ensure ~1s response times) and `highlights` with `maxCharacters` (to optimize downstream Gemini token usage) to pull specific data points like funding raises, new regions, and product launches with field-level citations.
- **Apollo.io & Crunchbase Fallbacks**: Use Apollo.io for company metrics (headcount, funding history). While Crunchbase is a valuable data source, it lacks a generous free API tier. Therefore, Crunchbase data will primarily be accessed via Gemini's Google Search Grounding rather than direct API integration to minimize costs.
- **Bring Your Own Key (BYOK) for Premium Sources**: Allow users to add their own API keys for premium data sources such as Crunchbase or advanced Apollo.io tiers. The system will conditionally use these premium endpoints if a valid key is provided, enabling enterprise users to bypass free-tier limitations.
- **Raw Data Library Integration**: Ensure that all pulled data (articles, reports, raw API responses from Exa/Crunchbase/Apollo) is successfully ingested and stored in the "Raw Data Library." This provides users with a verifiable source of truth and allows for re-processing of historical data without redundant API calls.
- **Automated Intelligence Extraction**: The system will continuously poll and map findings into structured `DerivedInsight` and `DataSource` objects, categorized by `opportunity`, `threat`, or `trend`.

## Capabilities

### New Capabilities
- `news-article-search`: A background worker or triggered workflow that queries Exa API and Gemini to discover recent competitor news articles and PR.
- `intelligence-extraction`: A Gemini-powered pipeline that parses Exa `highlights` to identify new features, regions, use cases, products, threats, and funding events.
- `byok-integration-manager`: A settings module to securely manage user-provided API keys (Crunchbase, Clearbit, advanced Apollo) to unlock premium data endpoints.
- `raw-data-ingestion`: A capability to persist all retrieved API payloads and articles as immutable records in the Raw Data Library.

### Modified Capabilities
- `data-sync-review`: The extracted news intelligence will be routed through the new Sync Queue (proposed in `data-sync-review`) so users can granularly review and accept/reject new insights before they mutate the `SystemContext` or `Competitor` state.

## Impact

- **`src/types.ts`**: 
  - Update the `DataSource['source']` type to include `'Exa.ai'` and `'Crunchbase'`. 
  - Add fields to `DerivedInsight` for specific tags like `'funding'`, `'product-launch'`, or `'region-expansion'`.
  - Introduce `UserSettings` to handle custom API keys (e.g., `crunchbaseApiKey`, `apolloPremiumApiKey`).
  - Add `RawDataRecord` interface to define the structure of the ingested raw JSON/text stored in the Raw Data Library.
- **`src/App.tsx`**: Add the `runNewsDiscovery` function to handle the orchestration between Exa API (for fetching news) and Gemini API (for synthesis and structuring). Update state management to ingest outputs into the Raw Data Library.
- **UI Components**: Add a settings modal/section where users can securely input their own Crunchbase/Premium API keys, and update the Raw Data Library view to display these new scraped artifacts.
- **Environment**: Require `EXA_API_KEY` in `.env` as the baseline.
- **Cost/Performance**: By using Exa's `highlights` instead of full page text, and offloading broad searches to Gemini with Grounding, we optimize token usage and maintain high retrieval quality without hitting expensive enterprise tiers by default. Users who want premium data can bring their own Crunchbase API keys.
