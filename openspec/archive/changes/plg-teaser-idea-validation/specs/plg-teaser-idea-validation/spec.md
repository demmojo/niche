# Spec: PLG Teaser for Idea Validation

## Features

### Anonymous Teaser Stream & AI Logic

- Unauthenticated users requesting `/api/scoring/stream` are routed to a low-cost, shallow-search execution branch.
- Remote Config is used for model resolution, with a fallback to `gemini-3.1-flash-lite-preview`.
- The `X-Accel-Buffering: no` header is set to bypass proxy buffering.

### Stateful Resume & Latency Optimization

- Intermediate AI state is cached to Firestore before emitting the `pql_gate` event.
- Upon resuming post-authentication, the backend skips redundant Exa searches by reading from the cached state.

### Usage Limits

- Anonymous usage is strictly capped to prevent abuse, tracked via IP or device fingerprint (shared with url-onboarding-plg).

### Frontend Graceful Halting & Conversion

- The UI transitions smoothly from live streaming to a Call-To-Action using Progressive Skeletons and a "Blur Tease" effect for the Tarpit Score.
- SSE parser uses safe error handling (calls `setError` instead of `throw`).

### Robust Auth Upgrade

- Uses an Inline Safe Auth component.
- Aborts the active SSE stream before calling `linkWithPopup`.
- Caches frontend state to `sessionStorage` before unmounts.
- Handles `auth/credential-already-in-use` errors gracefully.
- Calls `auth.currentUser?.reload()` after a successful account merge.

## Scenarios

**Scenario: Anonymous user submits a new idea**

- **WHEN** an unauthenticated user submits an idea to `/api/scoring/stream`
- **THEN** the backend uses Remote Config resolving to `gemini-3.1-flash-lite-preview` and `exa.search`
- **AND** processes Competitors and JTBD streams
- **AND** caches the intermediate state to Firestore
- **AND** emits a `pql_gate` event before generating the Tarpit Score.

**Scenario: Frontend handles the PQL Gate with UI Enhancements**

- **WHEN** the `TrustBuilderScreen` receives a `pql_gate` SSE
- **THEN** the streaming progression stops gracefully
- **AND** a "Blur Tease" and Inline Safe Auth CTA is rendered over the Tarpit Score
- **AND** previously generated data remains visible in the UI.

**Scenario: User authenticates via Inline Safe Auth**

- **WHEN** the user clicks to sign up via `linkWithPopup`
- **THEN** the frontend aborts the active SSE stream and backs up state to `sessionStorage`
- **AND** handles `auth/credential-already-in-use` if the user already exists
- **AND** calls `auth.currentUser?.reload()` upon successful merge.

**Scenario: Resuming post-authentication (Stateful Resume)**

- **WHEN** the newly authenticated user resumes the stream
- **THEN** the backend loads the cached Firestore state
- **AND** skips the Exa search and previous extraction steps
- **AND** successfully generates the final Tarpit Score.

**Scenario: User disconnects mid-stream**

- **WHEN** the client disconnects or aborts the stream
- **THEN** the backend `req.on('close')` event triggers an `AbortController`
- **AND** immediately halts ongoing Gemini and Exa network requests.

**Scenario: Anonymous user hits usage limit**

- **WHEN** an anonymous user exceeds 3 teaser streams
- **THEN** the API returns a 429 Too Many Requests error
- **AND** the frontend prompts the user to sign in to continue.
