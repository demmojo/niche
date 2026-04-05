# Tasks

### Phase 1: Streaming Stabilization

- [x] Add `min-h-[400px]` constraints to `TrustBuilderScreen` container.
- [x] Implement scroll anchoring and disable auto-expanding accordions during active stream.
- [x] Add smooth CSS transitions for `ZeroFrictionEntry` button collapse.

### Phase 2: Persistent Drawers & Flow Inversion

- [x] Replace `CompetitorDiscoveryModal` with a new `CompetitorDiscoveryDrawer` component.
- [x] Replace `DocumentationWizardModal` with `DocumentationWizardDrawer` component.
- [x] Invert wizard logic: prompt for format selection before the insight curation step.

### Phase 3: Generative UI Implementation

- [x] Update Express BFF to stream structured JSON/GenUI payloads instead of raw markdown.
- [x] Create React components for PRD sections (collapsible blocks, tables).
- [x] Implement GenUI stream parser in the frontend.

### Phase 4: Auth State & Caching

- [x] Update BFF to cache anonymous LLM generations using `intentId` with a 1-hour TTL.
- [x] Update `App.tsx` routing to serialize `intentId` into the PQL auth redirect URL.
- [x] Update Workspace load logic to check URL for `intentId` and fetch cached payload.
- [x] Implement robust `localStorage` fallback for mid-flow refresh resilience.
