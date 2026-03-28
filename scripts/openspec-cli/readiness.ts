import { ParsedSpec } from "./utils.js";

/**
 *
 */
export function checkReadiness(
  specs: ParsedSpec[],
  targetSpecId: string,
  silent: boolean = false,
): boolean {
  const targetSpec = specs.find((s) => s.id === targetSpecId);
  if (!targetSpec) {
    if (!silent) console.error(`❌ Spec '${targetSpecId}' not found.`);
    return false;
  }

  if (
    targetSpec.data.status === "superseded" ||
    targetSpec.data.status === "archived"
  ) {
    if (!silent)
      console.error(
        `❌ Spec '${targetSpecId}' is ${targetSpec.data.status} and should not be implemented.`,
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
      if (!silent)
        console.warn(`⚠️ Warning: Dependency '${depId}' not found in specs.`);
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
      console.error(
        `\n❌ Spec '${targetSpecId}' is NOT READY for implementation.`,
      );
      console.error(`The following dependencies must be completed first:`);
      for (const dep of unfulfilledDeps) {
        console.error(`  - ${dep}`);
      }
    }
    return false;
  }

  if (!silent)
    console.log(`✅ Spec '${targetSpecId}' is ready for implementation.`);
  return true;
}
