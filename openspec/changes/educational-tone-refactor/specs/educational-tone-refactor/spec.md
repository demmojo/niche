# Spec: Educational Tone Refactor

## Detailed Features

### 1. Anchor and Define Pattern

The AI will explain the mechanical 'why' (e.g., memory references, network latency, state changes) prior to introducing the architectural term. This grounds the learning process in concrete mechanics rather than abstract labels.

### 2. Complexity Scaling

The AI adjusts its explanation depth based on the task type. Trivial tasks (like typos) receive extremely concise responses, while complex architectural tasks receive deep mechanical breakdowns.

### 3. CI/CD Exemption

A strict directive that forces the AI to use precise, high-density architectural jargon for files matching `openspec/**/*.md`, commit messages, and CI/CD configurations.

## Scenarios

**Scenario 1: Complex Architectural Decision**

- **WHEN** the user asks for a complex code or architecture change
- **THEN** the AI explains the core mechanical problem (The Why) first, introduces the precise architectural label using the 'Anchor and Define' pattern, and then provides the code implementation (The How).

**Scenario 2: Simple Task Resolution**

- **WHEN** the user requests a simple UI fix or typo correction
- **THEN** the AI provides an extremely concise response without unnecessary mechanical breakdowns.

**Scenario 3: OpenSpec and CI/CD Editing**

- **WHEN** the AI writes or edits files in `openspec/changes/`, writes commit messages, or updates CI/CD pipelines
- **THEN** the AI explicitly bypasses the educational plain-English tone and uses precise, high-density architectural jargon to ensure automated `ai-eval` tools and Pairwise Judges succeed.
