import { ParsedSpec } from "./utils.js";
import { TerminalPresenter, isHeadless } from "./presenter.js";

/**
 *
 */
export function checkReadiness(
  specs: ParsedSpec[],
  targetSpecId: string,
  silent: boolean = false,
  presenter?: TerminalPresenter,
): boolean {
  const p = presenter || new TerminalPresenter(isHeadless() || silent, false);

  const targetSpec = specs.find((s) => s.id === targetSpecId);
  if (!targetSpec) {
    if (!silent) p.fail(`Spec '${targetSpecId}' not found.`, "spec_not_found");
    return false;
  }

  if (
    targetSpec.data.status === "superseded" ||
    targetSpec.data.status === "archived"
  ) {
    if (!silent)
      p.fail(
        `Spec '${targetSpecId}' is ${targetSpec.data.status} and should not be implemented.`,
        "invalid_status",
      );
    return false;
  }

  const deps = new Set(targetSpec.data.depends_on || []);
  for (const spec of specs) {
    if (spec.data.blocks && spec.data.blocks.includes(targetSpecId)) {
      deps.add(spec.id);
    }
  }

  let isReady = true;
  const unfulfilledDeps: string[] = [];

  for (const depId of Array.from(deps)) {
    const depSpec = specs.find((s) => s.id === depId);
    if (!depSpec) {
      if (!silent) p.warn(`Warning: Dependency '${depId}' not found in specs.`);
      isReady = false;
      unfulfilledDeps.push(`${depId} (Status: Not Found)`);
      continue;
    }

    if (
      !["implemented", "completed", "archived"].includes(
        depSpec.data.status || "",
      )
    ) {
      isReady = false;
      unfulfilledDeps.push(`${depId} (Status: ${depSpec.data.status})`);
    }
  }

  if (!isReady) {
    if (!silent) {
      p.fail(
        `Spec '${targetSpecId}' is NOT READY for implementation. The following dependencies must be completed first:\n  - ${unfulfilledDeps.join("\n  - ")}`,
        "dependencies_not_met",
        `openspec start <dependency>`,
      );
    }
    return false;
  }

  if (!silent) p.log(`✅ Spec '${targetSpecId}' is ready for implementation.`);
  return true;
}
