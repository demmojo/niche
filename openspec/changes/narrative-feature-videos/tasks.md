## 1. Engine & Cursor Upgrade

- [x] 1.1 Replace the red circle in `injectCursor` within `scripts/generate_feature_videos.cjs` with a realistic SVG path that resembles the standard macOS or Windows pointer (e.g., a black polygon with a white outline and small drop shadow).
- [x] 1.2 Modify `humanClick` and `humanMove` helpers in the script to use a slower, more deliberate `steps` count (e.g., 20-30 steps) and introduce random reading pauses (500ms-1500ms) before clicking targets.

## 2. Refactoring the 5 Narrative Flows

- [x] 2.1 Refactor "Automated Market Intelligence" to follow the specific narrative in `spec.md` (Start Dashboard -> Raw Data -> Background Tasks -> Click -> Watch Progress).
- [x] 2.2 Refactor "Visual Intelligence" to follow the narrative (Start Dashboard -> Market Analysis -> Wait for D3 -> Move and expand a node -> Scroll to Notebook -> Calculate).
- [x] 2.3 Refactor "Actionable Outputs" to follow the narrative (Start My Product -> Review -> Generate Docs -> Select PRD -> Generate -> Preview).
- [x] 2.4 Refactor "Human-in-the-loop Trust" to mock a pending sync diff (either by manipulating the `SyncQueue` or triggering a fast background sync), then click the "Sync Pending Review" banner -> Scroll diff -> Accept a change -> Close.
- [x] 2.5 Refactor "Flexible AI Power" to follow the narrative (Start Settings -> API Keys -> View inputs -> Change Primary Model -> Hover Quotas).

## 3. Quality Assurance

- [x] 3.1 Run `node scripts/generate_feature_videos.cjs` to produce the 5 new narrative `.webm` files.
- [x] 3.2 Visually verify that the custom cursor looks realistic, the movements are smooth and deliberate, and the mock data visible in the UI is highly realistic and compelling.
