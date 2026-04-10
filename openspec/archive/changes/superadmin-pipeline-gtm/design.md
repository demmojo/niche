# Design: Superadmin Pipeline (Lean MLP)

## Context

We are executing an accelerator-backed GTM strategy. The goal is speed, high perceived AI intelligence, and high-quality outputs. Complex AI DAGs currently introduce compounding error rates and delay launch. Following Leeropedia 2026 enterprise standards, we must also ensure strict JSON schema enforcement, mitigate web-search hallucination, and build a mathematically verifiable evaluation loop for the underlying data moat.

## Goals

- Implement a "Two-Phase Fetch" for immediate user value and deferred deep value.
- Create a secure Superadmin Queue (`/admin/pending-roasts`) to manually review AI synthesis before delivery.
- Enforce a Firebase Auth gate for the final report to guarantee PQL conversion.
- Implement Leeropedia JSON schema constraints (`zodToJsonSchema` + strict mode).
- Establish a foundational "LLM-as-a-Judge" CI/CD evaluation loop.

## Non-Goals

- Fully autonomous, unreviewed report delivery.
- Processing unlimited concurrent requests (capped at 50 to prevent DoS).
- 5+ Agent pipelines (collapsed to a 2-Agent pipeline to prevent compounding error rates).

## Decisions

- **2-Agent Pipeline:** DataGatherer (extracts intent + fetches Exa/Apollo via `gemini-3.1-flash`) hands off to ReportSynthesizer (Tarpit evaluation, Moat detection, Markdown generation via `gemini-3.1-pro`).
- **System Override Pattern:** To combat hallucination from Exa search results, the ReportSynthesizer's LLM classification must be validated against deterministic mathematical thresholds (e.g., `Float32Array` K-Means `orthogonalDistance`). If the math contradicts the LLM, the system overwrites the classification.
- **Strict Output Enforcement:** Manual JSON string parsing is banned. All agent outputs use `zodToJsonSchema` (strict mode, no additional properties) and are validated via discriminated unions to handle semantic failures gracefully.
- **Input Sanitization:** All incoming web data (Exa/Apollo) is sanitized using AST/regex (`DOMPurify`, `replace(/[<>]/g, "")`) to prevent indirect prompt injection.
- **No Magic Links:** Emails will deliberately NOT include unguessable direct links. Users must log in via Firebase Auth to view their proprietary market gaps.

## Risks & Trade-offs

- **Admin Bottleneck:** The system relies on a human (Superadmin) to review. The hard cap of 50 pending reports mitigates overload but may pause user acquisition temporarily.
- **Friction in Delivery:** Requiring a login adds friction, but this is an intentional trade-off to ensure lead capture.

## Future Potential

As the 2-agent pipeline improves and the automated LLM Judge proves hallucination rates have dropped below 2%, we can remove the Wizard of Oz manual review and expand back to a fully autonomous DAG, feeding SFT and DPO training data loops.
