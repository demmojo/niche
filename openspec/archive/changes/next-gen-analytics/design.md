## Context

NicheAI aims to be the premier platform for competitive intelligence. While the Lens Strategy Console provides excellent conversational analysis, the raw data visualization (Analytics) must match that premium feel. Executives demand "wow factor" charts and frictionless report generation. Behind the scenes, the increasing volume of scraped market data requires an autonomous, self-learning pipeline to maintain data integrity and prevent duplicate or low-signal features from polluting the dashboards.

## Goals / Non-Goals

**Goals:**

- Build a "Triple-Mode Smart Compose" reporting canvas (Templates, Freeform, Smart AI Layouts).
- Implement a fully automatic, self-learning backend pipeline for data deduplication and feature grouping based on vector embeddings.
- Ensure all charts, tables, and graphs are visually stunning, modern, and snappy.
- Deeply integrate the Analytics platform with the Lens Strategy Console (e.g., "Send to Lens" action).
- Enable high-fidelity exports to Spreadsheet, Image, and PDF formats.
- Implement an interactive, dismissible "spotlight" onboarding wizard.

**Non-Goals:**

- Replacing the Lens Strategy Console's core functionality (Analytics augments Lens, it doesn't replace it).
- Building a full-fledged Business Intelligence tool (like Tableau or PowerBI) from scratch; the focus remains strictly on competitive/product intelligence and predefined strategic templates.
- Real-time multiplayer collaboration on a single freeform canvas (for Phase 1).

## Decisions

**1. Data Pipeline Autonomy**

- **Decision**: The deduplication and feature grouping process will be **fully automatic**, working quietly in the background without requiring manual human-in-the-loop (HITL) approval.
- **Rationale**: Manual curation scales poorly as the platform ingests thousands of market signals daily. An automated background pipeline ensures the platform scales effortlessly while maintaining data integrity.
- **Alternatives Considered**:
  - _[Human-in-the-loop (HITL)]_: Rejected because it introduces a bottleneck and cognitive load for the user, negating the "autonomous" value proposition of the platform.

**2. Report Composition Modes**

- **Decision**: Implement a unified canvas supporting three modes: Pre-built Templates, Freeform Drag & Drop, and Smart Dynamic Layouts.
- **Rationale**: Meets users exactly where their skill and patience levels are. Executives can use Smart Layouts, while analysts can use Freeform for pixel-perfect control.
- **Alternatives Considered**:
  - _[Templates Only]_: Rejected because it is too restrictive for advanced competitive analysis.
  - _[Freeform Only]_: Rejected because the learning curve is too high for casual users needing a quick presentation.

**3. Vector Database Architecture**

- **Decision**: Utilize Supabase's `pgvector` extension for the automatic deduplication pipeline.
- **Rationale**: Leverages our existing Postgres infrastructure, reducing operational complexity while providing robust semantic similarity search via HNSW indexes.
- **Alternatives Considered**:
  - _[Dedicated Vector Store (Pinecone/Milvus)]_: Rejected for Phase 1 to avoid adding another external dependency and synchronization layer, though it remains an option if scale demands it later.

## Risks / Trade-offs

- **Risk: Frontend Performance** -> Building a drag-and-drop canvas that handles large datasets and transitions smoothly into export formats can lead to UI jank.
- **Mitigation**: Utilize React concurrent features, virtualization (`@tanstack/react-virtual` for tables), and push heavy computations to Web Workers or the BFF layer.
- **Risk: False Positives in Deduplication** -> The fully automatic pipeline might over-aggressively merge distinct but semantically similar features.
- **Mitigation**: Implement strict confidence thresholds for auto-merging and maintain a soft-delete/audit log in the database so merges can be audited or rolled back by superadmins if necessary.
