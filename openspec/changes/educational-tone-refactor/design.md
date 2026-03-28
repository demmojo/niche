# Design: Educational Tone Refactor

## Context

Currently, tone instructions are scattered across `AGENTS.md` and custom `.mdc` files, leading to a fragmented context window and inconsistent AI responses. By leveraging the CO-STAR framework in the global Cursor User Rules, we can explicitly separate Style (writing approach) from Tone (emotional quality).

## Goals

- Shift AI communication to first-principles thinking.
- Implement the "Anchor and Define" pattern.
- Centralize tone and style instructions into the CO-STAR global rule.
- Maintain architectural density where automated tools require it.

## Non-Goals

- We are not banning industry jargon entirely (doing so breaks AI reasoning and pattern recognition).
- We are not expanding the context window with new `.mdc` files specifically for tone.

## Decisions

1. **Use CO-STAR Mapping**: Map Style (S) to first-principles/Anchor and Define, Tone (T) to educational/mentoring, and Response (R) to scaling and CI/CD exemptions.
2. **Consolidation**: Drop redundant `.mdc` files and `AGENTS.md` modifications to avoid DRY violations and keep contexts lean.

## Risks & Trade-offs

- **Risk**: The AI might struggle with context switching between mentoring (plain English) and CI/CD files (dense jargon) within the same conversation.
- **Mitigation**: The explicit 'CI/CD EXEMPTION' in the Response (R) step of the CO-STAR rule creates a hard semantic boundary for the AI to follow.

## Future Potential

Further refinements can target specific development domains (e.g., frontend styling vs. backend system design) by adjusting the complexity scaling heuristics within the Response rule.
