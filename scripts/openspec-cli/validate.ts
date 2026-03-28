import { ParsedSpec } from "./utils.js";

export function checkCycles(specs: ParsedSpec[]) {
  // Build adjacency list for "depends_on" relationships
  const adj = new Map<string, string[]>();
  const nodes = new Set<string>();

  // First collect all valid spec IDs
  const validSpecIds = new Set<string>(specs.map((s) => s.id));
  let hasDangling = false;

  for (const spec of specs) {
    nodes.add(spec.id);
    const deps = spec.data.depends_on || [];

    // Also consider `blocks` as a reverse dependency
    const blocks = spec.data.blocks || [];

    const edges = adj.get(spec.id) || [];
    for (const dep of deps) {
      if (!validSpecIds.has(dep)) {
        console.error(
          `Dangling reference: ${spec.id} depends_on ${dep}, but ${dep} does not exist.`,
        );
        hasDangling = true;
      } else {
        edges.push(dep);
      }
    }
    adj.set(spec.id, edges);

    for (const blocked of blocks) {
      if (!validSpecIds.has(blocked)) {
        console.error(
          `Dangling reference: ${spec.id} blocks ${blocked}, but ${blocked} does not exist.`,
        );
        hasDangling = true;
      } else {
        const bEdges = adj.get(blocked) || [];
        bEdges.push(spec.id); // blocked depends on this spec
        adj.set(blocked, bEdges);
        nodes.add(blocked);
      }
    }
  }

  if (hasDangling) {
    return false;
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): boolean {
    if (recStack.has(node)) {
      console.error(`Cycle detected! Path: ${path.join(" -> ")} -> ${node}`);
      return true;
    }
    if (visited.has(node)) {
      return false;
    }

    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor, [...path])) {
        return true;
      }
    }

    recStack.delete(node);
    path.pop();
    return false;
  }

  let hasCycle = false;
  for (const node of nodes) {
    if (!visited.has(node)) {
      if (dfs(node, [])) {
        hasCycle = true;
      }
    }
  }

  if (hasCycle) {
    return false;
  } else {
    console.log("DAG validation passed: No cycles detected.");
    return true;
  }
}
