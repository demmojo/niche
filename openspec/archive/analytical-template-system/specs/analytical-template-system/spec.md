# Analytical Template System

A unified system for discovering, viewing, and interacting with analytical data, split into Presentation and Strategy workflows.

## Features

### 1. Template Gallery

- **Requirement:** A visual gallery allowing users to select templates, clearly categorized into "Presentation Templates" and "Analysis & Strategy Templates". Uses route-based code splitting to load only the necessary engine.

### 2. Presentation Viewer

- **Requirement:** A read-only, high-density dashboard renderer using the Brutalist UI. Top-level KPIs are placed in an F-Pattern layout, with modal drill-downs for deeper data exploration (Progressive Disclosure). Uses Recharts with data downsampling to prevent DOM node explosion.

### 3. Strategy Workspace

- **Requirement:** A split-pane interactive canvas. The left pane provides reference data and a virtualized AI chat; the right pane is the active structured canvas built with native CSS Grid (e.g., for SWOT or Lean Canvas).

### 4. Generative Pre-fill & Auto-Save

- **Requirement:** When a user opens a Strategy Template, AI agents automatically pre-fill known data. All inputs use local React state and trigger a debounced background sync, displaying a simple "Saving... / Saved" indicator. All rendered AI and user content is strictly sanitized via DOMPurify.

## Scenarios

- **WHEN** a user selects a Presentation Template
- **THEN** the system lazy-loads the Presentation Engine and renders a read-only dashboard using standard fetching, displaying top KPIs in an F-Pattern layout.

- **WHEN** a user views a dense chart in the Presentation Viewer
- **THEN** the system applies a downsampling algorithm to the data before passing it to Recharts, ensuring optimal rendering performance.

- **WHEN** a user selects a Strategy Template
- **THEN** the system lazy-loads the Strategy Engine, opens a split-pane workspace, and triggers an AI job to pre-fill the CSS Grid canvas.

- **WHEN** a user types into a Strategy Workspace grid
- **THEN** the local input state updates immediately, and a debounced API request syncs the data to the backend while showing a "Saving..." indicator, without mutating global state.
