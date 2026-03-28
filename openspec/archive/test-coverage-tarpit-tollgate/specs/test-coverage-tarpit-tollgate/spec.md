# Specification: Test Coverage Features & Scenarios

## 1. Domain Logic & Security

### Vector Math Operations (`calculateCosineSimilarity`)

- **WHEN** vectors are orthogonal, **THEN** it returns `0`.
- **WHEN** vectors are identical, **THEN** it returns `1`.
- **WHEN** vectors have zero-magnitude, **THEN** it gracefully prevents divide-by-zero errors.
- **WHEN** arrays have asymmetric lengths, **THEN** the operation gracefully rejects/fails.
- **WHEN** benchmarking 50x1536 floats, **THEN** execution time is <1ms.

### TOCTOU Credit Deduction

- **WHEN** 50 concurrent `POST /api/campaign/start` requests are made with only 1 credit available, **THEN** exactly 1 request succeeds and 49 fail with `402 Payment Required`.

### IDOR Cross-Tenant Protection

- **WHEN** an unauthorized user attempts to read/write `campaign_jobs/{id}`, **THEN** the request is blocked and raises an authorization error.

## 2. Backend API (`campaignRoutes.ts`)

- **WHEN** hitting `/api/campaign/start` with a missing payload, **THEN** it returns `400 Bad Request`.
- **WHEN** hitting `/api/campaign/start` with 0 credits, **THEN** it returns `402 Payment Required`.
- **WHEN** hitting `/api/campaign/start` with a valid payload and sufficient credits, **THEN** it returns `202 Accepted` and yields a `jobId`.

### Async Batching (`p-map`)

- **WHEN** using fake timers, **THEN** polling and timeouts behave deterministically and resolve accordingly.
- **WHEN** artificially failing 1 out of 10 requests in a batch (Chaos Testing), **THEN** the campaign completes gracefully indicating resilience (`stopOnError: false`).

## 3. Frontend Hooks & Components

- **`useActionCredits`**: **WHEN** the Firebase snapshot boundary is mocked and updates, **THEN** the hook reflects the new credit balance in real-time.
- **`ComputeMeter`**:
  - **WHEN** balance is 50, **THEN** it renders the Green status state.
  - **WHEN** balance is 5, **THEN** it renders the Orange warning status state.
  - **WHEN** balance is 0, **THEN** it renders the Red critical status state.
- **`TarpitWarningModal`**: **WHEN** rendered with `isOpen=true` and a user clicks "View Sub-Niches", **THEN** the Evolution Diff renders correctly.

## 4. E2E User Journeys (Playwright)

- **Journey 1: Deep Validation**: **WHEN** a user clicks "Run Deep Validation Campaign", **THEN** the UI shows a polling state and ultimately presents the Brutalist Tarpit Warning.
- **Journey 2: Pivot Flow**: **WHEN** a user clicks "Pivot to Niche (1 Credit)", **THEN** credit deduction occurs correctly and the UI routes to the newly generated idea.
