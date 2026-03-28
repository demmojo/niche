# Design: Inject Brand Identity

## Context

This feature bridges the gap between the `brand-positioning-wizard` and the `rapid-pdlc-prompt-exporter`, ensuring that strategy dictates the resulting frontend code.

## Goals

- Securely format and inject visual identity and personality into code-generation prompts.
- Provide strict formatting rules (shadcn/ui CSS overrides, Google Fonts).
- Semantically validate microcopy without relying on brittle Regex matches.

## Non-Goals

- We are not building a native UI generation engine.
- We are not validating exact CSS file strings via Regex, which is highly sensitive to LLM formatting quirks.

## Decisions

- **Pure Function Interpolation**: We will use a pure function (`formatBrandIdentityContext`) instead of an over-engineered plugin architecture for `promptAssembler.ts`.
- **Zod & Semantic AI Validation**: Visual checks (colors/fonts) will be validated by the human-in-the-loop, but we will use Gemini 2.5 Flash and strict Zod parsing to verify if microcopy semantics match the Brand Tone.

## Risks & Trade-offs

- **Risk**: External models (v0, Bolt) may ignore constraints and hallucinate arbitrary Tailwind inline styles.
- **Mitigation**: We utilize explicit XML blocks (`<critical_implementation_rules>`) and capitalized `THEME OVERRIDE MANDATE` to forcefully steer Claude-based generation models.
- **Risk**: AI Code Review is susceptible to prompt injection if the generated code contains malicious instructions.
- **Mitigation**: Code payload is explicitly wrapped in `<code_to_review>` XML boundaries to neutralize injection attempts.

## Future Potential

Future iterations could natively push this compiled prompt payload to v0/Bolt via an authenticated API rather than relying on clipboard copy-paste.
