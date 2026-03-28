import { ParsedSpec } from "./utils.js";

export function checkReadiness(
  specs: ParsedSpec[],
  targetSpecId: string,
): boolean {
  const targetSpec = specs.find((s) => s.id === targetSpecId);
  if (!targetSpec) {
    console.error(`❌ Spec '${targetSpecId}' not found.`);
    return false;
  }

  if (
    targetSpec.data.status === "superseded" ||
    targetSpec.data.status === "archived"
  ) {
    console.error(
      `❌ Spec '${targetSpecId}' is ${targetSpec.data.status} and should not be implemented.`,
    );
    return false;
  }

  // Find all dependencies
  const deps = new Set(targetSpec.data.depends_on || []);

  // Add reverse dependencies from `blocks` in other specs
  for (const spec of specs) {
    if (spec.data.blocks && spec.data.blocks.includes(targetSpecId)) {
      deps.add(spec.id);
    }
  }

  let isReady = true;
  const unfulfilledDeps: string[] = [];

  for (const depId of deps) {
    const depSpec = specs.find((s) => s.id === depId);
    if (!depSpec) {
      console.warn(`⚠️ Warning: Dependency '${depId}' not found in specs.`);
      isReady = false;
      unfulfilledDeps.push(`${depId} (Status: Not Found)`);
      continue;
    }

    // A dependency is fulfilled if it is 'implemented', 'completed', or 'archived'
    if (
      !["implemented", "completed", "archived"].includes(depSpec.data.status)
    ) {
      isReady = false;
      unfulfilledDeps.push(`${depId} (Status: ${depSpec.data.status})`);
    }
  }

  if (!isReady) {
    console.error(
      `\n❌ Spec '${targetSpecId}' is NOT READY for implementation.`,
    );
    console.error(`The following dependencies must be completed first:`);
    for (const dep of unfulfilledDeps) {
      console.error(`  - ${dep}`);
    }
    return false;
  }

  console.log(`✅ Spec '${targetSpecId}' is ready for implementation.`);
  return true;
}
