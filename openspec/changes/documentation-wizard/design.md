## Context
Users have product data and AI insights stored in NicheAI but need to share them with external stakeholders or engineering teams in standardized formats.

## Goals / Non-Goals

**Goals:**
- Provide a guided step-by-step UI to select what to export.
- Support "One-Pager", "PRD", and "OpenSpec Archive" formats.
- Provide a preview of the generated document.
- Allow copying to clipboard or downloading as a file.

**Non-Goals:**
- Do not currently support exporting to PDF or Word formats.
- Do not send these documents via email.

## Decisions

**1. Client-Side Generation**
- **Decision**: All document generation, including ZIP creation, happens in the browser.
- **Rationale**: Reduces server load and provides immediate feedback, leveraging `jszip` and browser Blob APIs.

## Risks / Trade-offs

- **Risk: Large ZIP generation** -> Could freeze the UI for a moment.
- **Mitigation**: Add a mock "Generating" state and `setTimeout` to show progress to the user.