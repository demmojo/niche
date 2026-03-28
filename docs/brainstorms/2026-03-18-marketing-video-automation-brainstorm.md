# Brainstorm: Marketing Video Automation & Mock Data

**Date:** 2026-03-18
**Topic:** Automating feature videos, hydrating realistic mock data, and triggering via version changes.

## What We're Building

A system to ensure our marketing feature videos (`.webm` files) are always up-to-date and populated with realistic, rich dummy data. This system needs to automatically trigger whenever a developer or AI bumps the project version.

## Core Challenges Identified

1. The current feature video scripts (`generate_feature_videos.cjs`) rely on either an empty UI state or highly limited inline mock data, leading to boring, unconvincing marketing assets.
2. Hardcoding massive mock data payloads into the Playwright scripts makes them unmaintainable.
3. Importing mock data synchronously into the main React app bloats the production bundle.
4. There is currently no automated link between bumping a version (signifying a new release) and generating new marketing assets.

## Explored Approaches

### Approach A: Playwright API Interception (Network Mocking)

Playwright intercepts all outbound API requests to Firebase/Apollo and returns the massive mock data payloads directly from the testing script.

- **Pros:** Zero impact on the `src/` application code. Completely isolated.
- **Cons:** Very brittle. If the internal component logic or state management changes, the network intercepts often break. Setting up complex derived state (like the mindmap) via raw network mocks is difficult.

### Approach B: Dynamic State Hydration (URL Flag) [Recommended]

Create `src/utils/demoMockData.ts`. The React app listens for `?demo_data=true` in the URL. If present, it uses an asynchronous dynamic `import()` to load the data and inject it directly into the Zustand/React state stores.

- **Pros:** 100% realistic component rendering. Incredibly easy to maintain as it uses the same TypeScript interfaces as production data. Zero bundle bloat because dynamic imports aren't bundled in the main chunk.
- **Cons:** Requires a small amount of conditional logic inside the main `App.tsx` or provider.

### Approach C: Separate "Demo" Build Target

Create a separate Vite configuration (`vite.demo.config.ts`) that swaps out the API layer with a mock layer at build time.

- **Pros:** Completely clean separation of concerns.
- **Cons:** Over-engineered for a simple video recording script. Doubles the build time in CI.

## Key Decisions

1. **Proceed with Approach B (Dynamic State Hydration)**: We will create `demoMockData.ts` and dynamically import it via a URL parameter to hydrate the application state for video recording.
2. **Focus on the "Big 5" Features**: The videos will be streamlined to focus solely on the core B2B value proposition: Automated Market Intelligence, Visual Intelligence, Strategic Market Analysis, Actionable Outputs, and Team Collaboration. Secondary features (like API keys) will be dropped from the primary video generation script.
3. **NPM Lifecycle Integration**: We will utilize Node's native `postversion` script in `package.json` to automatically trigger `node scripts/generate_feature_videos.cjs` and git-stage the results whenever `npm version` is run.

## Resolved Questions

- _How do we ensure the AI knows to bump the version properly?_ We will create a `.cursor/skills/release-version/SKILL.md` file instructing agents to use `npm version minor` (or major), ensuring the `postversion` hook runs natively.

## Next Steps

The outcome of this brainstorm has been converted directly into an OpenSpec structure located at `openspec/changes/marketing-video-automation/`.
