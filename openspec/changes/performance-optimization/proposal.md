## Why

The current NicheAI platform suffers from sluggish performance, bloated initial Javascript payloads, and render-blocking assets. A monolithic architecture in the frontend means all heavy dependencies (diagrams, rich text editors, AI SDKs) are fetched and evaluated synchronously. Eagerly streamed, massive videos on the landing page penalize mobile bandwidth and push out the Largest Contentful Paint (LCP). To provide a premier "Command Center" user experience, we must eliminate these bottlenecks.

## What Changes

This change introduces aggressive code-splitting for large feature components, defers loading of heavy AI SDKs, natively memoizes the React tree using the React 19 Compiler, and optimizes all media assets to dramatically improve page load speed and runtime responsiveness.

## Capabilities

### Modified Capabilities

- `core-app-initialization`: Now lazy-loads heavy feature modules via `React.lazy()` and `<Suspense>`, reducing the critical blocking script size.
- `ai-client-initialization`: AI SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`) are now dynamically imported at runtime only when an AI feature is explicitly invoked, rather than bundled in the initial vendor chunk.
- `video-rendering`: Marketing and feature videos use `preload="none"` with lightweight `poster` frames to defer high-bandwidth streaming until interaction or explicit scrolling.
- `react-rendering-engine`: Implements `babel-plugin-react-compiler` to automatically memoize components, drastically reducing UI lockups from state cascades in the `App.tsx` monolith.

## Impact

This impacts the entire frontend architecture:

- `src/App.tsx`: Refactored to use `React.lazy()` for heavy nested views.
- `src/utils/aiClient.ts`: Rewritten to support dynamic imports of SDK classes.
- `vite.config.ts`: Configured with new React Compiler plugins and Vite image optimizers.
- `package.json`: Pruning unused dependencies (`better-sqlite3`).
- `public/videos/`: Requires generation of lightweight poster images for the videos.
