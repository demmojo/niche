# NicheAI: Metrics, KPIs & Design Principles

This document explicitly separates the success metrics of the product from the evaluation metrics of the underlying AI models. It also serves as the source of truth for all Generative UI and Human-in-the-Loop (HITL) design patterns.

---

## 1. Product OKRs & Success Metrics

**Objective: Become the default validation and strategy engine for digital product builders.**

### Key Results (Q1-Q2 2026 Focus)

- **KR 1 (Activation):** Achieve a 25% conversion rate from a free "Roast My Niche" widget interaction to a registered user within the application.
- **KR 2 (Engagement):** 40% of Weekly Active Users (WAU) generate at least one Product Requirement Document (PRD) or OpenSpec export per week.
- **KR 3 (Retention):** 60% month-over-month retention for users who interact with the Lens Strategy Console more than 3 times in their first 7 days.

---

## 2. Machine Learning vs. Product Metrics

We do not optimize for raw model accuracy (F1, AUC) at the expense of user experience. We explicitly define the UX cost of failure.

### The Impact of Failure (False Positives vs. False Negatives)

- **False Positive (The AI hallucinates a competitor feature that doesn't exist).**
  - **UX Impact:** Severe. It misleads the founder into building a defensive feature against a ghost. This breaks trust.
  - **Action:** The Prompt Pipeline must heavily penalize hallucination. We employ strict RAG grounding (retrieval-augmented generation) and require explicit citations (e.g., URL links to the competitor's pricing page) for every claim.
- **False Negative (The AI misses a subtle pricing change or a minor feature update).**
  - **UX Impact:** Moderate to Low. The user still receives significant value from the broader analysis, and they are likely to manually catch specific details they care about deeply.
  - **Action:** The system favors precision over recall. It is better to show 5 highly accurate, validated insights than 20 insights where 3 are hallucinated.

### The AI Evaluation Stack

- **Trust Signals (The True Metric):** How often do users accept an AI suggestion _without_ editing it? High acceptance rates indicate the model is highly aligned with the user's intent.
- **Edit Distance:** If a user edits an AI-generated PRD, what is the Levenshtein distance between the AI output and the final human-approved document? Our goal is to minimize this distance over time via the Data Flywheel.

---

## 3. Product Design Principles (The "Feel")

NicheAI employs a "Guided Journey" philosophy. We actively steer users away from saturated markets and toward validated, hyper-niche defensible opportunities. We do not offer blank canvases.

### Designing for Uncertainty

- **Graceful Degradation:** The AI will sometimes fail due to API rate limits (e.g., 429 Too Many Requests) or overly complex prompts. The UI must never freeze. Use optimistic UI updates and skeleton loaders. Provide clear error states with actionable fallbacks (e.g., "The AI is currently analyzing this market. Would you like to view the raw data in the meantime?").
- **Asynchronous Job Queues:** Users should not wait on a loading spinner for a 30-second web scrape. The UI must acknowledge the request immediately and use background sync mechanisms (e.g., toast notifications or progressive sync banners) to deliver the result.

### Human-in-the-Loop (HITL) Workflows

- **No Autonomous Action:** NicheAI never auto-publishes PRDs or auto-updates competitive taxonomies without human approval.
- **The Review Queue:** All incoming data changes (e.g., from background web searches) are queued in the "Data Sync Review" portal. The user must explicitly approve or reject changes before they hit the global database.
- **Opt-Out Mechanisms:** Users must have the ability to override AI suggestions easily (e.g., manual overrides on auto-generated tags or scores).

### Generative UI

- **Dynamic Interfaces over Static Forms:** Instead of presenting a generic 10-field form, NicheAI should dynamically generate interfaces based on the context. If the AI identifies that "Pricing Model" is the key differentiator in a specific market, the UI should instantly generate a comparative pricing table block for the user to review.
- **Visual Intelligence:** Shift from text-heavy reports to visual mapping. Use interactive React Flow whiteboards and dynamically generated charts (via Recharts or D3) to allow founders to "see" their market gaps rather than just read about them.
