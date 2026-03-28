## 1. UI Foundation & Theming

- [x] 1.1 Define the new Brutalist color palette and typography in Tailwind config (Clash Display, JetBrains Mono, Switzer).
- [x] 1.2 Update base components to support the new "Deep Dark Mode" styling.

## 2. Template Gallery & Routing

- [x] 2.1 Build the selection UI distinguishing Presentation vs. Analysis & Strategy templates.
- [x] 2.2 Wire up routing with `React.lazy` and `Suspense` to code-split the Presentation and Strategy engines.

## 3. Presentation Engine

- [x] 3.1 Build the `PresentationViewer` component wrapper.
- [x] 3.2 Implement the F-Pattern KPI layout component and modal drill-downs.
- [x] 3.3 Integrate Recharts with Brutalist styling for read-only dashboards.
- [x] 3.4 Implement a data downsampling utility (e.g., LTTB algorithm) to prevent DOM node explosion in Recharts.
- [x] 3.5 Ensure API endpoints return strict DTOs to prevent excessive data exposure.

## 4. Strategy Engine

- [x] 4.1 Build the `StrategyWorkspace` split-pane layout component.
- [x] 4.2 Build structured canvases (e.g., SWOT, Lean Canvas) using native CSS Grid and standard inputs.
- [x] 4.3 Implement the reference data / AI chat interface on the left pane.
- [x] 4.4 Implement DOM virtualization (`@tanstack/react-virtual`) for the AI chat history to prevent memory bloat.

## 5. Data & Security Integration

- [x] 5.1 Connect the generative pre-fill logic to the Strategy Engine initialization.
- [x] 5.2 Implement strict sanitization using `DOMPurify` for all AI-generated output and user canvas input. Ensure `dangerouslySetInnerHTML` is not used unsafely.
- [x] 5.3 Implement local React state for canvas inputs with a simple debounced background sync and "Saving... / Saved" UI indicator.
- [x] 5.4 Ensure backend authorization checks are strictly enforced on all debounced sync endpoints (prevent BOLA/IDOR).

## 6. Refinement

- [x] 6.1 Apply motion animations and "flash" state transitions across the views.
- [x] 6.2 Verify that no sensitive corporate data is being cached in plaintext `localStorage`.
