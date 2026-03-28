# Spec: Tech Debt Fixes

## Background Workflows (BullMQ)

- **SCENARIO:** Processing K-Means Clustering
  - **WHEN:** A clustering job is enqueued.
  - **THEN:** A standard BullMQ worker picks it up (max concurrency 5), validating job.data through a Zod schema before processing.

## API & Routing

- **SCENARIO:** Heavy LLM Route Invocation
  - **WHEN:** A client requests an LLM generation.
  - **THEN:** The Express controller immediately returns a 202 Accepted with a jobId.
- **SCENARIO:** Vector Similarity Execution
  - **WHEN:** Cosine similarity is calculated concurrently.
  - **THEN:** The pure function instantiates a fresh Float32Array(768) to safely process the math without cross-request corruption.
- **SCENARIO:** Competitor Discovery (Heuristics First)
  - **WHEN:** A client requests competitor discovery via `baseIdea`.
  - **THEN:** The system parses inputs strictly with Zod, strips `<>` tags, searches via Exa, calculates semantic similarity locally using deterministic embeddings instead of a generative LLM, and avoids Express 5 `try/catch` wrappers.

## Framework & Error Handling

- **SCENARIO:** Payload too large
  - **WHEN:** A client sends a payload exceeding limits.
  - **THEN:** body-parser throws entity.too.large, and the Express global error handler explicitly catches it to return a structured JSON response.
- **SCENARIO:** React 19 Async Tearing
  - **WHEN:** State needs updating after an await inside a transition.
  - **THEN:** The post-await update is wrapped in a nested startTransition.

## Testing Isolation

- **SCENARIO:** Test Suite Execution
  - **WHEN:** Integration tests run in parallel.
  - **THEN:** Each file uses a randomized GCLOUD_PROJECT ID, and afterEach clears the emulator via DELETE /emulator/v1/projects/{projectId}/... REST API.
