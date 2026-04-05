# Design: PLG Builder Paradigm

## Architecture & State

1. **Two-Phase Fetch:** We use an optimistic `fetch` pattern. Stage 1 data (deterministic) renders immediately. Stage 2 data (generative) streams in.
2. **State Management:** The "Intelligence Sidebar" relies on a global `WorkspaceProvider` (React Context) separated into state and dispatch to prevent render cascades when arrays are updated.
3. **PQL Modal:** Uses `@radix-ui/react-dialog` with a `Dialog.Portal` to ensure it breaks out of `overflow:hidden` constraints while keeping the background DOM mounted.
4. **Auth Upgrade:** Utilizes Firebase `linkWithPopup`. Wraps the call in a strict `AbortController` and `try/catch` to handle `auth/credential-already-in-use` fallback smoothly.

## Visual UI / Styling

- Clean SaaS aesthetic relying on Tailwind CSS.
- **Typography:** Inter (UI) and Newsreader (Serif content).
- **Simulated Highlights:** Implemented via `<span role="button" class="transition-all hover:bg-amber-100...">` rather than custom DOM `window.getSelection()`.
- **Pre-Gate Canvas:** `backdrop-filter: blur(4px)` with a strict lock icon overlay preventing interaction with custom text areas.
