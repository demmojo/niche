# NicheAI Landing Page & Product Features Master Document

*This document serves as the ultimate source of truth for NicheAI's marketing copy, value propositions, and feature highlights. It must be updated automatically whenever new features are added via the OpenSpec workflow.*

## Target Audience
- **Primary:** Broad Audience (Founders, PMs, Engineers)
- **Goal:** Balance high-level market intelligence value with deep technical flexibility, control, and verifiable data.

## Core Value Proposition
"NicheAI is the autonomous market intelligence platform that never sleeps. Get proactive competitor updates, instant product documentation, and visual market mapping—while remaining completely in control of your data and AI models."

---

## Highlighted Features (The "Big 5")

These features are to be prominently displayed on the landing page (using short 10-15s GIFs) and detailed product pages (using 30-60s MP4 walkthroughs).

### 1. Automated Market Intelligence (News Article Search)
- **Value Prop:** "Never miss a competitor update."
- **Description:** NicheAI continuously monitors the web using Exa search and Gemini's reasoning engine to extract critical events—funding rounds, new product launches, and emerging threats.
- **Visuals:** 
  - *Demo Video:* `<video src="/videos/automated-market-intelligence.webm" autoplay loop muted playsinline></video>`

### 2. Visual Intelligence (Mindmap Explorer & Market Value Notebook)
- **Value Prop:** "See your market, don't just read about it."
- **Description:** Transform static competitor lists into dynamic, interactive D3 mindmaps, and calculate real-time estimated market values using interactive notebooks.
- **Visuals:** 
  - *Demo Video:* `<video src="/videos/visual-intelligence.webm" autoplay loop muted playsinline></video>`

### 3. Actionable Outputs (Documentation Wizard)
- **Value Prop:** "Turn intelligence into instant product documents."
- **Description:** Don't let insights rot in a dashboard. Instantly export comprehensive Product Requirement Documents (PRDs) and OpenSpec archives directly from your AI findings.
- **Visuals:** 
  - *Demo Video:* `<video src="/videos/documentation-wizard.webm" autoplay loop muted playsinline></video>`

### 4. Human-in-the-loop Trust (Data Sync Review)
- **Value Prop:** "You're in control. No silent AI overwrites."
- **Description:** AI is powerful, but you own the truth. Our Sync Queue intercepts all automated state changes so you can granularly review, accept, or reject AI-proposed data updates. Pin fields to protect your manual work.
- **Visuals:** 
  - *Demo Video:* `<video src="/videos/data-sync-review.webm" autoplay loop muted playsinline></video>`

### 5. Flexible AI Power (BYOK, Model Fallback & Quotas)
- **Value Prop:** "Bring your own keys. Never hit a rate limit."
- **Description:** Don't be locked into one provider. Input your own OpenAI, Anthropic, or Gemini keys. Set priority fallbacks to ensure high availability, and monitor your exact API quotas in real-time.
- **Visuals:** 
  - *Demo Video:* `<video src="/videos/flexible-ai-power.webm" autoplay loop muted playsinline></video>`

---

## Maintenance Guidelines
When the `apply-openspec` workflow completes a feature implementation:
1. Review this document and add/modify features if a new capability warrants landing page real estate.
2. Ensure the "Value Prop" aligns with the newly added feature's core "Why".
3. Verify that all in-app documentation (e.g., `PageGuideModal.tsx`, tooltips, UI copy) has been updated to reflect the new feature reality.
4. **Video Regeneration**: If the applied OpenSpec modifies the UI or functionality of an existing feature listed here, use `node scripts/generate_feature_videos.cjs` to regenerate the WebM video. If a new major feature is added to this list, add it to the Playwright script to create a new feature video for it.