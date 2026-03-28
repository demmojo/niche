## Why

> **NOTICE:** This spec has been **superseded** by `analytical-template-system`.

Founders and Product Managers waste months and thousands of dollars building features nobody wants. Traditional market research is slow, manual, and disconnected from the actual product development cycle. Users need a system that acts like an AI-powered Chief Product Officer—one that automatically gathers market intelligence, applies battle-tested frameworks (JTBD, Blue Ocean, Assumption Mapping), and tells them exactly where the market gaps are. The core value is **de-risking the product before writing a single line of code**.

## What Changes

Replacing the static, rigid "Analytical Template Library" with a dynamic, data-driven "Strategy Toolbox". This tool transforms passive form-filling into an active insight engine.

Instead of empty templates, users get 5 high-value, early-stage methodologies (Competitor Feature Gap, JTBD Opportunity Landscape, Assumption Mapping, Fake Door Validation, Blue Ocean Value Curve) that are _pre-populated_ with real market data (competitor reviews, sentiment, intent signals).

## Capabilities

### New Capabilities

- **Instant Strategic Clarity:** The `strategy-toolbox-ui` provides a clean, modern hub for selecting the right analytical tool for the right stage of the product lifecycle.
- **Actionable Visuals & Recommendations:** The `toolbox-engine` executes these tools, presenting data visually (e.g., a quadrant showing high-importance, low-satisfaction features) and offering definitive recommendations.
- **Zero-Effort Market Intelligence:** The `external-signals-sync` background job continuously syncs real-world data (Exa API sentiment & intent, Apollo.io firmographics) so the tools are always ready with fresh insights.
- **Verifiable AI Insights:** `ml-insights` tracks confidence scores and verbatim quotes, ensuring product decisions are grounded in real user feedback, not AI hallucinations.

### Modified Capabilities

- `analytical-templates`: Deprecated. We are moving from "fill-in-the-blank documents" to "live, data-driven strategy tools."

## Impact

**The Best Case Scenario (The "Magic" Moment):**
A founder enters their competitors, opens the **JTBD Opportunity Landscape**, and the AI highlights a specific "Job" that is highly important but terribly served by incumbents. They use **Assumption Mapping** to identify the riskiest assumption, launch a **Pretotyping (Fake Door) Validation** campaign directly from the platform, and within 24 hours have empirical data proving demand. They then click "Generate MVP" and the system outputs the exact code and specs needed. **Result: They found product-market fit before spending a dime on engineering.**

This feature fundamentally shifts the product from a static planning tool into a Rapid Product Development Lifecycle (PDLC) engine.
