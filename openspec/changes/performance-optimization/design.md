## Context

The current `src/App.tsx` has grown to over 8,100 lines, synchronously loading all sub-components. This means third-party dependencies (`recharts`, `@xyflow/react`, `openai`) are evaluated simultaneously when users land on the page, pulling in roughly 3MB of unminified JavaScript. This bloated entry point, combined with unoptimized `<video>` tags that stream eagerly, causes significant performance bottlenecks.

## Goals / Non-Goals

**Goals:**

- Dramastically reduce the Time to Interactive (TTI) and Largest Contentful Paint (LCP) by code-splitting heavy components using `React.lazy()` and `<Suspense>`.
- Defer loading of AI SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`) to runtime via dynamic imports.
- Auto-memoize the massive `App.tsx` React tree using the React 19 Compiler (`babel-plugin-react-compiler`) to prevent top-down re-render cascades.
- Stop immediate streaming of large marketing videos by adding `preload="none"` and static `poster` images.
- Prune completely unused native dependencies (`better-sqlite3`).

**Non-Goals:**

- A complete architectural rewrite of the 8,100-line `App.tsx` monolith (this is a performance sprint, not a structural refactor).
- Migrating to React Server Components (RSC) or a meta-framework like Next.js/Remix. We will optimize the current Vite/SPA architecture.

## Decisions

**1. Dynamic AI SDK Imports in Client**

- **Decision**: Refactor `src/utils/aiClient.ts` to use `await import('openai')` inside action handlers, rather than top-level static imports.
- **Rationale**: The OpenAI, Anthropic, and Google GenAI SDKs pull in substantial Node.js polyfills and wrappers (roughly ~1.6MB unminified). Bundling these directly into the frontend entry graph forces all users to download them, even if they only view a simple dashboard.
- **Alternatives Considered**:
  - _Move AI logic purely to a backend_: Ideal, but requires significant architectural changes outside the scope of this performance optimization.

**2. React 19 Compiler Integration**

- **Decision**: Introduce `babel-plugin-react-compiler` in `vite.config.ts`.
- **Rationale**: `App.tsx` has roughly 45 local `useState` hooks. Any state change triggers a synchronous top-down re-render. Instead of manually wrapping thousands of child components in `React.memo` (which is error-prone), the compiler automatically memoizes the reactivity.
- **Alternatives Considered**:
  - _Manual Memoization_: Too tedious and error-prone for an 8,100-line file with complex props.

**3. Asset Deferral & Optimization**

- **Decision**: Update all `<video>` tags to include `preload="none"` and a lightweight `poster` image. Preload Google Fonts natively in `index.html`.
- **Rationale**: Eagerly streaming 8.6 MB of high-quality `.webm` videos on load heavily penalizes mobile users and destroys the LCP metric. Preloading fonts prevents layout shifts and rendering delays.

## Risks / Trade-offs

- **Risk: React Compiler Errors** -> The compiler relies heavily on the Rules of React. It may fail to build if `App.tsx` contains conditional hook calls or mutations during render.
- **Mitigation**: We will test the build process extensively (`npx tsc` and `npm run build`) and refactor any violating components manually.
- **Risk: UI Jitter from Code Splitting** -> Lazy-loading heavy modals might cause a noticeable delay when clicking a button for the first time.
- **Mitigation**: Use a seamless, visually pleasing `<Suspense>` fallback (like a generic loading spinner or skeleton UI) so the user perceives immediate feedback.
