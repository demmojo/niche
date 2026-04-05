# Specification

## Features & Scenarios

### 1. Streaming Stabilization

- **WHEN** an unauthenticated user clicks an intent in `ZeroFrictionEntry`
- **THEN** the button collapses smoothly and a `min-h-[400px]` skeleton container reserves space, preventing CLS.

### 2. State Hydration & Refresh Trap Prevention

- **WHEN** a user is mid-flow and refreshes the page
- **THEN** the application recovers the state using URL search parameters and local session storage.

### 3. PQL Auth Latency Elimination

- **WHEN** a user hits the PQL gate and authenticates
- **THEN** the application redirects them to the workspace with their `intentId` appended in the URL.
- **AND** the BFF instantly returns the cached Gemini/Exa payload, bypassing the 10-15s generation time.

### 4. Context-Preserving Drawers

- **WHEN** a user opens Competitor Discovery or Documentation Wizard
- **THEN** a side drawer slides in, leaving the workspace context visible in the background.

### 5. Generative UI Document Creation

- **WHEN** the Documentation Wizard streams a generated PRD
- **THEN** the stream renders as collapsible, interactive React components rather than a wall of markdown text.
- **AND** the wizard requires the user to pick a format before beginning the curation step.
