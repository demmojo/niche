---
title: Performance Optimization
type: brainstorm
date: 2026-03-27
status: draft
---

# User Value Proposition

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

# What We're Building

A comprehensive performance optimization overhaul of the NicheAI platform to dramatically improve page load speed, reduce JavaScript bundle size, optimize asset delivery, and eliminate rendering bottlenecks. This initiative focuses on the Vite/React 19 architecture without sacrificing feature richness.

# Why This Approach

The current application has grown organically into a monolithic frontend. `src/App.tsx` contains over 8,100 lines and eagerly loads every single feature module (e.g., `VisualWhiteboard`, `AnalyticalTemplateSystem`, `LensStrategyConsole`, `InsightQuestModal`). This forces the browser to download, parse, and evaluate almost 3MB of JavaScript before rendering the initial UI.

Additionally, AI SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`) are bundled into the main client graph, causing significant bloat. Heavy charting (`recharts`) and diagramming (`@xyflow/react`) libraries are loaded unnecessarily on the dashboard view.

By applying aggressive code splitting, asset optimization, and rendering optimizations (like the React 19 Compiler), we can drastically improve Time to Interactive (TTI) and Largest Contentful Paint (LCP).

# Key Decisions

1. **Aggressive Route & Component Code Splitting:**
   - Implement `React.lazy()` and `<Suspense>` inside `src/App.tsx` for all non-critical, heavy feature views (e.g., `VisualWhiteboard`, `Settings`, `AnalyticalTemplateSystem`, `InsightQuestModal`, `ConsolidateFeaturesModal`).
   - Dynamically import AI SDKs in `aiClient.ts` so they are only fetched when AI capabilities are explicitly invoked by the user.

2. **Rendering Performance Enhancements:**
   - Integrate `babel-plugin-react-compiler` into `vite.config.ts` to automatically memoize components, bypassing the need to manually add `React.memo` across the 8,100-line `App.tsx` and preventing massive re-render cascades.

3. **Asset & Media Optimization:**
   - Optimize `<video>` tags by adding `preload="none"` and generating/adding lightweight `poster` images to prevent eager streaming of heavy `.webm`/`.mp4` files.
   - Introduce `vite-plugin-image-optimizer` to compress local images natively during build.
   - Preload critical fonts natively to eliminate render-blocking latency.

4. **Dependency Pruning:**
   - Remove unused phantom dependencies (e.g., `better-sqlite3` which adds native node C++ bloat).
   - Ensure proper Vite `manualChunks` configurations only execute when those chunks are dynamically requested.

# Open Questions

- Should we transition external Google Fonts to self-hosted fonts for maximum FCP speed, or rely on React 19 `preload()`?
- Are there specific high-impact videos in `public/videos/` that must autoplay immediately, or can they all be deferred until interacted with or explicitly scrolled into view?
- Should we decouple `App.tsx` completely, or is implementing `React.lazy` on its heavy child components sufficient for this sprint?
