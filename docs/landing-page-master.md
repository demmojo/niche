# NicheAI Landing Page & Product Features Master Document

_This document serves as the ultimate source of truth for NicheAI's marketing copy, value propositions, and feature highlights. It must be updated automatically whenever new features are added via the OpenSpec workflow._

## Target Audience

- **Primary:** Broad Audience (Founders, PMs, Engineers)
- **Goal:** Balance high-level market intelligence value with deep technical flexibility, control, and verifiable data.

## Core Value Proposition

"NicheAI is the autonomous market intelligence platform that never sleeps. Get proactive competitor updates, instant product documentation, and visual market mapping—while remaining completely in control of your data and AI models."

---

## Highlighted Features (The "Big 5")

These features are to be prominently displayed on the landing page and detailed product pages using full-size, high-definition `WebM` video walkthroughs.

### 1. Automated Market Intelligence (News Article Search)

- **Value Prop:** "Never miss a competitor update."
- **Description:** NicheAI continuously monitors the web using web search and our AI's reasoning engine to extract critical events—funding rounds, new product launches, and emerging threats.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/automated-market-intelligence.webm" autoplay loop muted playsinline></video>`

### 2. Visual Intelligence (Analytical Template System & Whiteboards)

- **Value Prop:** "See your market, don't just read about it."
- **Description:** Transform static competitor lists into dynamic, interactive React Flow whiteboards with bi-directional linking. Utilize our new Analytical Template System to switch between read-optimized Presentation Dashboards and write-optimized Strategy Workspaces (SWOT, Lean Canvas) with AI generative pre-fill.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/visual-intelligence.webm" autoplay loop muted playsinline></video>`

### 3. Actionable Outputs (Documentation Wizard)

- **Value Prop:** "Turn intelligence into instant product documents."
- **Description:** Don't let insights rot in a dashboard. Instantly export comprehensive Product Requirement Documents (PRDs) and OpenSpec archives directly from your AI findings.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/documentation-wizard.webm" autoplay loop muted playsinline></video>`

### 4. Proactive Market Analysis (Lens Strategy Console)

- **Value Prop:** "From raw data to executive strategy, automatically."
- **Description:** The Lens AI Product Strategist works proactively to analyze market data and draft high-value product features and insights. Utilizing a high-trust "Suggest & Draft" paradigm, explainable rationale, and a frictionless rejection feedback loop that functions as Agent Memory, Lens ensures your strategy is always data-driven and actionable.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/strategic-market-analysis.webm" autoplay loop muted playsinline></video>`

### 5. Team Collaboration & Multi-Product Workspaces

- **Value Prop:** "Scale your intelligence across products and teams."
- **Description:** Manage multiple product lines from a single dashboard. Securely invite team members to collaborate on shared market data, ensuring everyone stays aligned on competitor movements and strategic insights.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/team-collaboration.webm" autoplay loop muted playsinline></video>`

### 6. Unified Ideation & Evolution Engine

- **Value Prop:** "From blank slate to validated MVP in minutes."
- **Description:** Escape analysis paralysis and feature bloat. Use the Intent-Based Router to start from an idea or brainstorm from competitor URLs. Our AI ingests market data asynchronously and presents a Tinder-style Hybrid Product Builder with strict MVP budgeting guardrails to ensure you build a lean, defensible product.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/unified-ideation.webm" autoplay loop muted playsinline></video>`

### 7. Human-in-the-Loop Taxonomy Merging

- **Value Prop:** "Clean, deduplicated market taxonomies powered by you and AI."
- **Description:** Take control of your market analysis with optimistic UI feature merging. Select similar features and merge them instantly while a Hybrid Validation Pipeline (Cosine Similarity + LLM-as-a-Judge) works in the background to safely update the global taxonomy without polluting the data.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/taxonomy-merging.webm" autoplay loop muted playsinline></video>`

### 8. Head-to-Head Product Comparison

- **Value Prop:** "See exactly where you win and lose against competitors."
- **Description:** Compare your product directly against top competitors in a side-by-side view. Easily spot differences in core features, target audience, pricing strategy, and integrations. Our automated data normalization ensures you're comparing apples to apples.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/head-to-head-comparison.webm" autoplay loop muted playsinline></video>`

### 9. Rapid Strategy-to-Code Exporter

- **Value Prop:** "Instantly translate product strategy into production-ready UI."
- **Description:** Don't let your validated ideas sit in a document. The Strategy-to-Code Wizard instantly generates CO-STAR optimized prompts injecting your Jobs-to-be-Done, competitor flaws, and explicit Brand Identity (colors, fonts, tone). Paste these into external AI code generators, then use our Loop-Back Artifact Reviewer to semantically validate the generated code against your strategic constraints.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/strategy-to-code-exporter.webm" autoplay loop muted playsinline></video>`

### 10. Reverse Demo Hook (Product-Led Growth)

- **Value Prop:** "Experience the 'Aha!' moment before ever signing up."
- **Description:** Escape the hard authentication wall. With our Zero-Friction Entry, simply type what you want to build and watch as our ML orchestration engine instantly builds a full, shareable strategy dashboard. Discover lucrative sub-niches, assess market saturation, and experience true value—only creating an account when you're ready to save, edit, or deploy.
- **Visuals:**
  - _Demo Video:_ `<video src="/videos/reverse-demo-hook.webm" autoplay loop muted playsinline></video>`

---

## Maintenance Guidelines

When the `apply-openspec` workflow completes a feature implementation:

1. Review this document and add/modify features if a new capability warrants landing page real estate.
2. Ensure the "Value Prop" aligns with the newly added feature's core "Why", referencing `docs/strategy/BUSINESS_PLAN.md` if necessary.
3. Verify that all in-app documentation (e.g., `PageGuideModal.tsx`, tooltips, UI copy) has been updated to reflect the new feature reality.
4. **Video Regeneration**: If the applied OpenSpec modifies the UI or functionality of an existing feature listed here, use `node scripts/generate_feature_videos.cjs` to regenerate the WebM video. If a new major feature is added to this list, add it to the Playwright script to create a new feature video for it.
