---
title: Performance Optimization
type: feat
status: active
date: 2026-03-27
---

# Performance Optimization and Page Load Speed Improvements

## User Value Proposition

**Speed is a feature. Build at the speed of thought.**

Users come to NicheAI to accelerate their product development, but a sluggish, unresponsive UI breaks their flow and frustrates them. Heavy load times, janky scrolling, and delayed interactions make the tool feel cheap and untrustworthy.

**Why use this tool?**
This initiative ensures that the NicheAI platform feels instantly responsive, lightweight, and professional.

**What is the expectation of the result?**

- **Instant Load Times:** The app loads immediately, even on slower connections, because users only download the code they actually need at that moment.
- **Buttery Smooth Interactions:** Clicking through menus, opening modals, and typing in text fields feels instantaneous with zero lag.
- **Battery & Data Friendly:** Mobile and laptop users won't see their batteries drained by heavy background scripts or autoplaying videos they aren't even watching.

**The Best Case Scenario:**
A user has an epiphany during a meeting, opens NicheAI on their laptop, and the dashboard appears instantly. They navigate between the Strategy Toolbox and the Whiteboard seamlessly without ever seeing a loading spinner. They can capture their idea and get back to their meeting without breaking stride.

## Overview

A comprehensive performance optimization overhaul of the NicheAI platform to drastically improve page load speed, reduce JavaScript bundle size, optimize asset delivery, and eliminate rendering bottlenecks. This initiative focuses on the Vite/React 19 architecture, relying heavily on modern best practices without sacrificing feature richness.

## Problem Statement / Motivation

Currently, the NicheAI web application's initial bundle is massive and unoptimized.

- The main `src/App.tsx` file is monolithic (>8,100 lines) and statically imports almost every feature module (e.g., `VisualWhiteboard`, `AnalyticalTemplateSystem`, `LensStrategyConsole`, `InsightQuestModal`).
- Heavy AI SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`) are bundled directly into the frontend entry points, dragging in Node.js polyfills and inflating the vendor chunk.
- Third-party data visualization tools (`recharts`, `@xyflow/react`) and rich text editors (`@tiptap/react`) are eagerly loaded even when users land on simple dashboard views.
- Large video assets (`public/videos/*.webm`) autoplay and stream immediately, destroying Largest Contentful Paint (LCP) and mobile bandwidth.
- Google Fonts (`Lora`, `Nunito`) block initial renders, creating a noticeable delay.

This results in a sluggish Time to Interactive (TTI), huge bandwidth usage, and poor initial rendering performance due to state-driven re-render cascades in the `App.tsx` monolith.

## Proposed Solution

1. **Aggressive Route & Component Code Splitting:** Implement `React.lazy()` and `<Suspense>` inside `src/App.tsx` for all non-critical, heavy feature views.
2. **AI SDK Isolation:** Refactor `src/utils/aiClient.ts` to dynamically import the AI SDKs only when an AI action is triggered.
3. **Rendering Performance Enhancements:** Integrate `babel-plugin-react-compiler` into `vite.config.ts` to automatically memoize components, bypassing the need to manually add `React.memo` across the massive `App.tsx` and preventing re-render cascades.
4. **Asset & Media Optimization:** Optimize `<video>` tags with `preload="none"` and lightweight `poster` images. Add `vite-plugin-image-optimizer` to the build pipeline and handle external font preloading.
5. **Dependency Pruning:** Remove unused phantom dependencies (e.g., `better-sqlite3`). Ensure proper Vite `manualChunks` configurations map correctly to lazy-loaded components.

## Technical Considerations

- **React 19 Compiler:** The introduction of `babel-plugin-react-compiler` changes how components re-render. We must ensure that the codebase strictly adheres to the Rules of React for this to compile successfully.
- **Dynamic Imports:** Code splitting requires a robust `<Suspense fallback={...}>` architecture so users don't encounter jarring layout shifts while lazy chunks load.

## Acceptance Criteria

### Functional Requirements

- [ ] All heavy features (`VisualWhiteboard`, `AnalyticalTemplateSystem`, `LensStrategyConsole`, `InsightQuestModal`, `Settings`, `ConsolidateFeaturesModal`) are lazy-loaded via `React.lazy()` and wrapped in `Suspense`.
- [ ] AI SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`) are excluded from the main initial bundle, dynamically loaded in `aiClient.ts` only when needed.
- [ ] `vite.config.ts` incorporates the React 19 Compiler (`babel-plugin-react-compiler`) to auto-memoize components.
- [ ] The `better-sqlite3` dependency is uninstalled.
- [ ] `<video>` assets in the UI are updated to use `preload="none"` and have lightweight static `poster` images added to prevent eager streaming.
- [ ] Fonts are preloaded in `index.html` to eliminate render-blocking.

### Quality Gates

- [ ] The unminified initial JavaScript payload is significantly reduced (verified via `npm run build` visualizer).
- [ ] Time to Interactive (TTI) and Largest Contentful Paint (LCP) on the dashboard view see a measurable improvement.
- [ ] All existing automated tests continue to pass.

## Success Metrics

- **Bundle Size Reduction:** Reduce the main initial entry bundle size by at least 50% (targeting < 300KB parsed).
- **LCP Optimization:** Achieve a visual render without blocking on heavy video or SDK downloads.

## Dependencies & Risks

- The React 19 Compiler may throw build errors if existing components violate the Rules of React (e.g., conditional hook calls). We must address these safely.
- Adding `<Suspense>` boundaries to deeply nested components in `App.tsx` might cause unexpected UI flicker if not handled gracefully.

## References & Research

- Best Practices Research: React 19 `useOptimistic`, RSCs, React Compiler auto-memoization, and route-based code splitting.
- Tailwind v4 Native Purging (Lightning CSS).
- Vite `vite-plugin-image-optimizer` for static asset compression.
- Previous Brainstorm: `docs/brainstorms/2026-03-27-performance-optimization-brainstorm.md`
