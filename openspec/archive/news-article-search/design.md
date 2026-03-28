## Context

To provide continuous, actionable market intelligence, NicheAI needs to ingest external competitor news such as funding rounds, new feature launches, and competitive threats. A scheduled or manual background task—"News Article Search"—will use the Exa API to query recent articles about competitors and pass the content to Gemini for extraction of structured insights.

## Goals / Non-Goals

**Goals:**
- Implement a `runNewsDiscovery` pipeline orchestrating Exa API and Gemini API.
- Search for competitor news using Exa API (`category: "news"`, `category: "company"`, `type: "auto"`).
- Extract structured insights (`DerivedInsight`) using Gemini API based on Exa highlights.
- Ingest raw search results into `rawDataSources` (Raw Data Library).
- Queue generated insights through `queueSyncChanges`.

**Non-Goals:**
- Full, real-time streaming web crawlers.
- Automated scheduling via CRON jobs (currently a manual trigger).
- Direct integrations with premium Apollo or Crunchbase APIs beyond BYOK stubs.

## Decisions

1. **Exa API Configuration:**
   - **Decision:** Use Exa API with `type: "auto"` and `highlights: true` to reduce payload size and token consumption.
   - **Rationale:** Sending full HTML contents to Gemini is expensive and slow. Exa highlights provide sufficient context for Gemini to extract entities like funding amounts or feature names.
2. **Insight Generation:**
   - **Decision:** Process the highlights using the unified `aiClient` and `withModelFallback` utility, prompting the AI to output JSON adhering to the `DerivedInsight` schema.
   - **Rationale:** Ensures structured, parseable insights and leverages the newly implemented model fallback mechanism.
3. **Data Ingestion:**
   - **Decision:** Store the Exa JSON payload in `rawDataSources` and pass extracted insights to `queueSyncChanges`.
   - **Rationale:** Ensures the "Data Sync Review" workflow controls how new insights enter the system, and maintains a verifiable trail in the raw data library.

## Risks / Trade-offs

- **Risk:** High LLM token usage from large Exa payloads.
  - **Mitigation:** Rely exclusively on `highlights` and restrict `numResults` to keep the context window manageable.
