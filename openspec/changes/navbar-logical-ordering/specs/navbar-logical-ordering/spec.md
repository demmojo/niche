# Navbar Logical Ordering

The sidebar navigation will be reordered to reflect a logical user journey for a data product, specifically an Observe -> Analyze -> Act -> Configure progression.

## Features

### 1. Reordered Navigation Items

- **Requirement:** The sidebar navigation items must be grouped and ordered as follows:

  **OVERVIEW** (Stage 1: Observation)
  - Dashboard / Home (if applicable)
  - My Product (Internal performance context)
  - Market Analysis (External competitive context)

  **IDEATION & INSIGHTS** (Stage 2: Analysis)
  - Insight Generator (AI-driven insights from data)
  - Brainstorming / Mindmaps (Interactive exploration)

  **EXECUTION** (Stage 3: Action)
  - Task Inbox (Action items generated from insights)
  - Documentation Wizard (Exporting/sharing findings)

  **DATA FOUNDATION** (Stage 4: Management)
  - Data Sources (APIs, Uploads, Connections)
  - Raw Data Library (Tabular view of all ingested data)

  **UTILITY & SYSTEM** (Stage 5: Administration - pinned to bottom)
  - Superadmin Analytics (If applicable to the user role)
  - Settings
  - User Profile / Support (if applicable)

## Scenarios

- **WHEN** a user logs in and views the sidebar navigation
- **THEN** they see navigation items grouped by workflow stage (Observe, Analyze, Act, Configure) with utility items (like Settings) separated and pinned to the bottom.
