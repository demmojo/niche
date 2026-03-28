# Performance Optimization

The NicheAI platform is being overhauled to deliver a significantly faster, more responsive user experience by focusing on bundle size reduction, asset optimization, and rendering performance within its Vite/React 19 architecture.

## Features

### 1. Code-Splitting and Lazy Loading

- **Requirement:** Convert heavy component imports in `src/App.tsx` (`VisualWhiteboard`, `AnalyticalTemplateSystem`, `LensStrategyConsole`, `InsightQuestModal`, `ConsolidateFeaturesModal`, `Settings`) to dynamic imports using `React.lazy()`.
- **Requirement:** Wrap these lazy components in a `<Suspense fallback={<LoadingSpinner />}>` boundary to handle loading states gracefully.

### 2. AI SDK Isolation

- **Requirement:** Refactor `src/utils/aiClient.ts` to remove top-level imports of `openai`, `@anthropic-ai/sdk`, and `@google/genai`.
- **Requirement:** Instead, dynamically `import()` these modules inside the respective function calls (e.g., inside `generateCompletion`, `runAnthropicPrompt`, etc.) and cache the instances so they are only evaluated when needed.

### 3. Rendering Enhancements (React Compiler)

- **Requirement:** Install `babel-plugin-react-compiler` and configure it within `vite.config.ts`.
- **Requirement:** Ensure all React components pass the compiler's strict checks (fixing any Rules of React violations) to achieve automatic memoization and prevent massive re-render cascades in the `App.tsx` monolith.

### 4. Asset Optimization (Video & Fonts)

- **Requirement:** Add `preload="none"` to all marketing/feature `<video>` tags.
- **Requirement:** Generate lightweight `.jpg`/`.png` poster images for each video and apply them to the `poster="..."` attribute.
- **Requirement:** Add `<link rel="preload" href="..." as="style">` for external Google Fonts in `index.html`.
- **Requirement:** Uninstall `better-sqlite3` from `package.json` as it is an unused native dependency inflating the tree.

## Scenarios

- **WHEN** a user visits the landing page or initial dashboard,
- **THEN** the browser downloads a much smaller initial JavaScript bundle (excluding AI SDKs, `recharts`, and `@xyflow/react`), drastically improving Time to Interactive.

- **WHEN** a user opens the "Visual Whiteboard" or "Analytical Templates" tab for the first time,
- **THEN** a fallback loading spinner is briefly shown while the specific chunk for that feature is fetched, preventing the main application from hanging.

- **WHEN** a user triggers an AI capability,
- **THEN** the heavy AI SDK modules are dynamically downloaded and instantiated in the background, keeping the initial load pristine.

- **WHEN** a user scrolls past a marketing video,
- **THEN** the video only begins to buffer or play upon explicit interaction or visibility, saving bandwidth and prioritizing critical text/images for the Largest Contentful Paint.
