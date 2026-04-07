# Spec: Detailed Features & Behaviors

## Core Feature: Intent-Driven Iterative Journeys

All high-value intents uniformly map to the PQL gate to capture value seamlessly.

### Scenarios

**Scenario 1: The Defensible Founder (`intent: "validate"`)**

- **WHEN** user inputs a hyper-niche idea.
- **THEN** system streams JTBD, gaps, and grounded scores.
- **AND** hits the PQL gate -> Prompts login.
- **THEN** triggers Iterative Next Step: Prompts user to run a Micro-Competitor Radar on identified incumbents.

**Scenario 2: The Guided Pivot (`intent: "validate"`)**

- **WHEN** user inputs a saturated horizontal idea.
- **THEN** Tarpit score > 80 is generated.
- **AND** system proves why idea fails and validates 3 pivots.
- **THEN** provides the _least_ viable pivot for free to prove competence, gating the "Best Match" pivot behind the PQL.

**Scenario 3: The Micro-Competitor Radar (`intent: "analyze"`)**

- **WHEN** user inputs a competitor name.
- **THEN** system streams Market Radar showing competitor weak spots.
- **AND** hits PQL Gate -> Proceeds to Founder Workspace upon login.

**Scenario 4: The URL Extraction (`intent: "url"`)**

- **WHEN** user inputs a landing page URL.
- **THEN** `/api/scoring/url-teaser` securely extracts JTBD and 2 pivots (validating SSRF rules).
- **AND** hits PQL Gate -> Iterative Next Step: User imports the URL as a direct competitor.

**Scenario 5: The Co-Founder Pushback - System Override Guardrail (`intent: "validate"`)**

- **WHEN** user inputs a tarpit-adjacent idea with high orthogonal vector distance.
- **THEN** system intelligently overrides the penalty.
- **AND** UX visualizes with a "Defensibility Radar" chart (suppressing raw `[SYSTEM OVERRIDE]` text) showing the idea pulling away from incumbents, accompanied by expert copy.
