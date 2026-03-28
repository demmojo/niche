# Brainstorm: Multi-Product Validation & Forking Engine

## 1. Core Philosophy & Heuristics First

In NicheAI, the goal is to prevent founders from over-engineering "horizontal" solutions (the tarpit). By allowing them to fork their product ideas and run concurrent "Fake Door" tests, they let the market decide the best hyper-niche.

**Anti-Bloat Principle:** We do NOT want to build Mixpanel or Google Analytics. We only care about binary signals that prove a niche is viable.

## 2. Tracking Fake Door Metrics Heuristically (Without Bloat)

**The Problem:** Founders need to know which fake door is performing well, but building a time-series analytics dashboard with charts is a massive distraction and technical bloat.

**The Solution (Heuristic Tracking):**

- **The "Validation Score" Heuristic:** Instead of forcing the user to analyze raw graphs, we distill performance into a single opinionated heuristic score.
  - Example formula: `Validation Score = ((Emails Collected * 10) + (CTA Clicks * 2)) / Unique Views`
- **Lean Data Collection:**
  - Do not track session durations, bounce rates, or complex user flows.
  - Expose a simple `/api/metrics/track` endpoint (or use the existing Cloudflare integration) that accepts three events: `VIEW`, `CLICK_CTA`, `SUBMIT_EMAIL`.
  - In Firestore, use `FieldValue.increment(1)` on a simple `fakeDoorMetrics` object stored directly on the `Product` document.
- **UI MVP:** A simple "Validation Health" temperature gauge (Cold / Warm / Hot) per product, rather than a dense analytical dashboard.

## 3. Data Modeling: Forking Product State

**The Problem:** How do we represent branched product ideas without breaking the current schema or creating complex merge conflicts?

**The Solution (Append-Only Forking):**

- **Schema Additions:** When a user clicks "Fork Product", we create a _shallow clone_ of the existing `MyProductData` document into a new Firestore document.
- We add three new fields to the `Product` schema:
  1. `forkedFromId: string | null` (Points to the parent product's ID)
  2. `pivotHypothesis: string` (e.g., "Pivot to focus exclusively on pediatric dentists instead of general practitioners")
  3. `experimentStatus: 'draft' | 'validating' | 'winner' | 'archived'`
- **Why this works:** It treats products like Git branches. By duplicating the data, the new product can evolve its Features, Strategy, and Branding independently without polluting the original idea.
- **Routing:** Each fork generates a distinct `siteToken` to deploy its own Fake Door landing page.

## 4. MVP Approach to Comparing Concurrent Products

**The Problem:** How does the founder view and decide on the winner without getting overwhelmed by managing multiple products?

**The Solution (The Validation Arena):**

- **The UI:** Introduce a "Validation Arena" or "Experiments Leaderboard" view when a product has active forks.
- **Visual Layout:** A side-by-side card layout. Each card shows:
  - Product Name & `pivotHypothesis` (What makes this variant different?)
  - The Heuristic Validation Score (Hot/Warm/Cold indicator).
  - A prominent "Double Down" button.
- **The "Double Down" Action:**
  - When the founder is ready, they click "Double Down" on the winning variant.
  - The system marks the chosen product as `winner` (making it the active context in the `ProductSwitcher`).
  - It automatically archives (`experimentStatus: 'archived'`) the parent and sibling forks.
  - The UI celebrates the decision, clearing the cognitive load and focusing the founder solely on executing the winning niche.
