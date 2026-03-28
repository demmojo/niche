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

### 2. Visual Intelligence (Visual Whiteboard & Next-Gen Analytics)

- **Value Prop:** "See your market, don't just read about it."
- **Description:** Transform static competitor lists into dynamic, interactive React Flow whiteboards with bi-directional linking. Utilize our Next-Generation Analytics Platform for powerful charts, tables, and generative narrative insights powered by a self-learning data pipeline.
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

---

## Maintenance Guidelines

When the `apply-openspec` workflow completes a feature implementation:

1. Review this document and add/modify features if a new capability warrants landing page real estate.
2. Ensure the "Value Prop" aligns with the newly added feature's core "Why".
3. Verify that all in-app documentation (e.g., `PageGuideModal.tsx`, tooltips, UI copy) has been updated to reflect the new feature reality.
4. **Video Regeneration**: If the applied OpenSpec modifies the UI or functionality of an existing feature listed here, use `node scripts/generate_feature_videos.cjs` to regenerate the WebM video. If a new major feature is added to this list, add it to the Playwright script to create a new feature video for it.
