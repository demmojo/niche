# Tasks: Implementation Plan

## Phase 1: Client Utilities & UI Updates

- [x] Implement client-side `hexToHsl` converter utility.
- [x] Add the `Enforce Brand Identity` toggle to `StrategyToCodeWizard.tsx` (Step 1).
- [x] Wire the wizard state to default to true if `ProjectBrandIdentity` exists.

## Phase 2: Prompt Assembler Logic

- [x] Create `formatBrandIdentityContext` pure function in `promptAssembler.ts`.
- [x] Implement conditional injection of `ProjectBrandIdentity.positioning` for Tone and Voice.
- [x] Implement conditional injection of `ProjectBrandIdentity.visual_identity` mapped to HSL values.
- [x] Add explicit `<critical_implementation_rules>` XML formatting for shadcn/ui.

## Phase 3: Semantic Artifact Validation

- [x] Define the `ArtifactSemanticSchema` using Zod (`isToneCompliant`, `feedback`).
- [x] Implement `validateArtifactTone` in the Artifact Reviewer invoking Gemini 2.5 Flash.
- [x] Enforce the `<code_to_review>` XML tags in the review prompt to safeguard against injections.
- [x] Explicitly parse the stringified JSON via Zod before yielding reviewer results.

## Phase 4: Integration & E2E Testing

- [x] Generate an end-to-end prompt payload and test generation visually in v0.dev/Claude.
- [x] Ensure Shadcn global CSS variables correctly override default blue palettes to brand colors.
- [x] Execute a mock prompt injection string in the Artifact Reviewer to confirm `<code_to_review>` boundary efficacy.
