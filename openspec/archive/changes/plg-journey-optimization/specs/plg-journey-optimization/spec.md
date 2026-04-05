# Specification: PLG Journey Optimization

## Phase 1: Streaming Stabilization (Anti-CLS & Intent State)

- **Requirement:** The `ZeroFrictionEntry` must not violently shift layout upon intent selection. `TrustBuilderScreen` must reserve spatial dimensions before text streams in and never auto-expand accordion items. The user's query must survive accidental page refreshes.

**Scenario:** User selects an initial PLG intent

- **WHEN** the user clicks "Validate an existing idea" in `ZeroFrictionEntry`
- **THEN** the parent container maintains a `min-h-[400px]` boundary, and the browser's URL immediately updates to `?intent=validate` (URL-Driven State Persistence) to survive a tab reload.

**Scenario:** User triggers an AI stream analysis

- **WHEN** the SSE stream initiates in the `TrustBuilderScreen`
- **THEN** the UI renders a skeleton bounding box of predictable height. As completed JSON chunks arrive, completed steps receive checkmarks but **do not auto-expand**, preserving the user's reading flow with 0 Cumulative Layout Shift.

## Phase 2: Auth Gate Continuity & Eliminating the Double-Hit

- **Requirement:** The PQL lock screen must preserve visual context. The authentication flow must seamlessly resume the user's progress using a _cached_ LLM response rather than penalizing the user by regenerating the entire stream from scratch.

**Scenario:** User hits the PQL Gate

- **WHEN** the backend emits the `pql_gate` event
- **THEN** a frosted glass backdrop overlays the partially rendered analysis, maintaining visual continuity, and microcopy guarantees the user their progress is securely cached.

**Scenario:** User completes OAuth login (The Double-Hit Fix)

- **WHEN** the `linkWithPopup` promise resolves successfully
- **THEN** the app hydrates the user's workspace from the pre-computed anonymous cache. It instantly renders the locked Tarpit Score and skips the 10-15 second wait time of regenerating the LLM output.

## Phase 3: Drawer Migration (Context Preservation & Non-Modal)

- **Requirement:** Center-screen modals used for complex, generative workflows must be replaced with right-side sliding drawers configured with `modal={false}` to prevent "Contextual Claustrophobia."

**Scenario:** User initiates Competitor Discovery

- **WHEN** the user clicks "Discover Competitors" in the authenticated workspace
- **THEN** a persistent right-side Drawer opens, leaving the underlying dashboard fully interactive so the user can cross-reference their ideation matrix.

## Phase 4: Generative UI & Inverted Wizard (Progressive Disclosure)

- **Requirement:** The `DocumentationWizardModal` (now a Drawer) must invert its flow to ask for the "Format" _first_ to avoid the "False Choice" trap. It must then stream AI output into structured React components.

**Scenario:** User initiates the Documentation Wizard

- **WHEN** the user opens the `DocumentationWizardDrawer`
- **THEN** Step 1 exclusively prompts the user to select the document format (PRD, Validation Spec, etc.). Subsequent steps are conditionally hidden or shown based on what that specific format actually requires.

**Scenario:** User generates a PRD or OpenSpec

- **WHEN** the AI stream begins generating product documentation
- **THEN** the UI progressively renders distinct, collapsible React Cards (e.g., "Architecture," "Market Gaps") as the stream parses. Skeletons hold the structure while partial chunks arrive, keeping cognitive load low.
