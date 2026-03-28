## Context

Users of data and analytics products generally follow a predictable psychological progression: Observe -> Analyze -> Act -> Configure. Structuring the sidebar to reflect this journey (Workflow-Based Navigation) is a UX best practice that reduces cognitive load and guides users logically from "understanding the current state" to "taking action."

## Goals / Non-Goals

**Goals:**

- Reorder sidebar navigation items to match a logical user journey: Observation (Overview), Analysis (Ideation & Insights), Execution (Action), Data Foundation (Management), and Utility (Administration).
- Group related navigation items together visually if supported by the UI framework.
- Pin utility items (like Settings) to the bottom of the sidebar.

**Non-Goals:**

- Adding new navigation items or features not currently present.
- Modifying the content of the views themselves.

## Decisions

**1. Sidebar Grouping and Ordering**

- **Decision**: Group navigation items into four main workflow stages: Overview (Observation), Ideation & Insights (Analysis), Execution (Action), and Data Foundation (Management), with Utility (Administration) pinned to the bottom.
- **Rationale**: This aligns with established SaaS UX best practices for data products, providing a clear path from high-level metrics to actionable outcomes.
- **Alternatives Considered**:
  - _Alphabetical Ordering_: Rejected as it doesn't reflect how users actually use the product.
  - _Flat Feature List_: Rejected as it increases cognitive load and doesn't guide the user.

## Risks / Trade-offs

- **Risk: User Confusion** -> Existing users might be confused by the sudden change in layout.
- **Mitigation**: Ensure the new grouping is intuitive and the names of the items remain consistent. Consider a small onboarding tooltip or announcement if the change is significant.
