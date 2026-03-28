## Context

The application currently lists competitors but lacks a direct side-by-side comparison feature. By building a dedicated comparison view, users can better understand their competitive edge. The design calls for a 3-column layout on desktop and a card-row layout on mobile.

## Goals / Non-Goals

**Goals:**

- Allow selection of up to 2 competitors from the DataPointsTable.
- Trigger a comparison view showing My Product alongside the selected competitors.
- Normalize different data structures (`ProductFeature` for My Product vs `coreFeatures` strings for Competitors).
- Display specs like integrations, target audience, and pricing clearly.
- Implement a responsive layout: 3-column on desktop, card-row on mobile.

**Non-Goals:**

- Comparing more than 2 competitors at a time.
- Editing competitor data directly from the comparison view.

## Decisions

**1. Data Normalization Strategy**

- **Decision**: Normalize `ProductFeature` and `coreFeatures` within the `HeadToHeadComparison` component rather than modifying the underlying data models.
- **Rationale**: Keeps the core data models clean and prevents regressions in other parts of the app that rely on the existing structures.
- **Alternatives Considered**:
  - _Updating the database/backend schema_: Rejected because it would require extensive migrations and impact other systems, whereas presentation-level normalization is quicker and safer.

## Risks / Trade-offs

- **Risk: Complex UI on Mobile** -> Comparing up to 3 entities (My Product + 2 Competitors) on small screens can cause horizontal scrolling or cramped UI.
- **Mitigation**: Strictly follow the card-row mobile best practices, potentially stacking the comparison vertically or using a carousel for the competitors on mobile devices.
