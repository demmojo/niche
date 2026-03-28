# docs: Overhaul developer and user documentation for consistency

## Motivation

Our documentation has drifted from the current state of the codebase and product. Several new features (Lens Strategy Console, Product Evolution Engine, Smart LLM Routing, Next-Gen Analytics) have been introduced but are missing from our high-level overviews and landing pages. Additionally, architectural folders and contributor guidelines contain outdated references and numbering errors that can confuse new developers.

## Objective

To bring all developer and user documentation up to date, ensuring consistency across the repository. This will improve developer onboarding, provide an accurate reflection of the product's capabilities, and maintain a clean, organized documentation structure.

## Requirements

Based on the findings from the `best-practices-researcher`, the following updates must be made:

1. **`README.md`**:
   - Update the Overview section to include the latest features: Lens, Product Evolution Engine, and Smart LLM Routing.
   - Update the Project Structure section to include the `openspec/` and `e2e/` directories.
   - Document any new or missing npm scripts.

2. **`CONTRIBUTING.md`**:
   - Fix header numbering issues (currently there are two "## 3" sections).
   - Update the quarantine folder reference from the outdated `tests/quarantine/` to the correct `e2e/quarantine/` path.

3. **`docs/architecture/`**:
   - Move all Architectural Decision Record (ADR) markdown files into a dedicated `decisions/` subfolder.
   - Add an index of these decisions to the `docs/architecture/README.md` file.

4. **`docs/landing-page-master.md`**:
   - Remove all references to the deprecated "Market Value Notebook".
   - Add sections detailing the "Lens Strategy Console" and "Next-Gen Analytics".

5. **`docs/onboarding/how-to/manage-releases.md`**:
   - Explicitly document that the `postversion` script automatically generates release videos as part of the versioning workflow.

## Execution

1. Open and edit `README.md` to update the overview, project structure, and scripts.
2. Open and edit `CONTRIBUTING.md` to fix the markdown headers and the quarantine directory path.
3. Create the `docs/architecture/decisions/` directory if it does not exist.
4. Move all `*.md` files (except `README.md`) from `docs/architecture/` to `docs/architecture/decisions/`.
5. Update `docs/architecture/README.md` to include an index linking to the files in the `decisions/` folder.
6. Open and edit `docs/landing-page-master.md` to replace "Market Value Notebook" with "Lens Strategy Console" and "Next-Gen Analytics".
7. Open and edit `docs/onboarding/how-to/manage-releases.md` to add documentation about the `postversion` video generation script.
8. Review all changes for markdown formatting and link validity before committing.
