## 1. Type Modifications
- [x] 1.1 Update `src/types.ts` to include `'Exa.ai'` as a valid `DataSource` type.
- [x] 1.2 Update the `DerivedInsight` interface if necessary to support specific tagging (e.g. funding, product-launch).

## 2. Implement the Orchestration Pipeline
- [x] 2.1 In `src/App.tsx`, create the `runNewsDiscovery` asynchronous function.
- [x] 2.2 Add an Exa API fetch call inside `runNewsDiscovery` that queries recent competitor news using `type: 'auto'` and `highlights: true`.
- [x] 2.3 Store the raw Exa API response in `rawDataSources`.

## 3. Insight Extraction and Queue Routing
- [x] 3.1 Pass the concatenated Exa highlights to `withModelFallback` to instruct Gemini to generate structured `DerivedInsight` objects.
- [x] 3.2 For each generated insight, queue it via `queueSyncChanges` with `entityType: 'DerivedInsight'`.
- [x] 3.3 Ensure the pipeline logs its progress using `addLog(..., 'Pending Review', 'info')`.

## 4. UI Integration
- [x] 4.1 Add a "News Article Search" or "Run News Discovery" button to the Background Tasks & Sync UI in `src/App.tsx`.
- [x] 4.2 Attach the `runNewsDiscovery` function to the button's `onClick` handler.
- [x] 4.3 Verify that rate limits (429s) gracefully trigger the `LimitReachedModal` or `RateLimitModal`.