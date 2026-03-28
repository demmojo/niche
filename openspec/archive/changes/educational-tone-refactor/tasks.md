# Tasks: Educational Tone Refactor

## Phase 1: Context Consolidation

- [x] Review current `AGENTS.md` and custom `.mdc` files for existing tone and style instructions.
- [x] Remove redundant tone-specific `.mdc` files.
- [x] Strip generic tone instructions from `AGENTS.md` to prevent prompt conflicts.

## Phase 2: CO-STAR Rule Update

- [x] Navigate to Cursor Settings > General > Rules for AI.
- [x] Update **Style (S)**: Add instructions for 'First-principles thinking' and the 'Anchor and Define' pattern (explain mechanics before jargon).
- [x] Update **Tone (T)**: Set persona to 'Educational, highly analytical, direct, and encouraging like a senior principal engineer mentoring a capable developer.'
- [x] Update **Response (R)**: Add the 3-step criteria including complexity scaling, The Why -> The How format, and the explicit CI/CD EXEMPTION for `openspec/`, commit messages, and CI/CD files.

## Phase 3: Validation & Testing

- [x] Prompt the AI with a complex architectural question to verify the 'Anchor and Define' explanation style.
- [x] Prompt the AI with a simple typo fix to verify extreme conciseness.
- [x] Prompt the AI to generate a commit message and edit an `openspec/**/*.md` file to verify the retention of high-density architectural jargon.
