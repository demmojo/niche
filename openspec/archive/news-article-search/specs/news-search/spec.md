# News Article Search Specification

## Overview
This specification details the orchestration of Exa API and Gemini API to perform a "News Article Search" that discovers competitor updates and extracts actionable insights into the Raw Data Library and Sync Queue.

## Requirements

### Data Types Update
- `DataSource` type must support `'Exa.ai'`.
- `DerivedInsight` type must include additional tags or categories where necessary (e.g. `'opportunity'`, `'threat'`, `'trend'`).

### Core Pipeline (`runNewsDiscovery`)
- Create an asynchronous function `runNewsDiscovery` in `src/App.tsx`.
- The function must iterate over all active `competitors` and query the Exa API using a search term like `"${competitor.name} recent news funding features"`.
- The Exa request must use `type: 'auto'`, `numResults: 3`, and enable `highlights`.
- The resulting JSON payload from Exa must be saved to the global `rawDataSources` state as a new immutable `RawDataRecord` or `DataSource` entry.
- The highlights text must be formatted into a prompt and sent to Gemini via `withModelFallback` and `aiClient`.
- Gemini must extract an array of `DerivedInsight` objects.
- Each extracted insight must be routed to `queueSyncChanges` (rather than direct state mutation), allowing the user to review the changes.

### Error Handling & Logging
- The function must use `addLog` to record start, progress, and completion states.
- Network errors or 429 Rate Limits from Exa or Gemini must be caught and gracefully handled (e.g. via `RateLimitModal`).
