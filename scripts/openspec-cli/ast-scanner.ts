import {
  Project,
  SourceFile,
  SyntaxKind,
  FunctionDeclaration,
  VariableDeclaration,
} from "ts-morph";
import { execSync } from "child_process";

export interface SemanticSignature {
  name: string;
  type: "Component" | "Function" | "Hook" | "Endpoint" | "Unknown";
  propsOrArgs: string[];
  returnType: string;
  isExported: boolean;
}

export interface FileASTDiff {
  filePath: string;
  added: SemanticSignature[];
  removed: SemanticSignature[];
  modified: { old: SemanticSignature; new: SemanticSignature }[];
}

/**
 *
 */
function extractSignatures(sourceFile: SourceFile): SemanticSignature[] {
  const signatures: SemanticSignature[] = [];

  // Extract functions
  sourceFile.getFunctions().forEach((func) => {
    signatures.push({
      name: func.getName() || "anonymous",
      type: func.getName()?.startsWith("use") ? "Hook" : "Function",
      propsOrArgs: func
        .getParameters()
        .map(
          (p) =>
            p.getName() +
            (p.getTypeNode() ? `: ${p.getTypeNode()?.getText()}` : ""),
        ),
      returnType: func.getReturnTypeNode()?.getText() || "any",
      isExported: func.isExported(),
    });
  });

  // Extract arrow functions assigned to variables (often React components)
  sourceFile.getVariableDeclarations().forEach((varDecl) => {
    const initializer = varDecl.getInitializer();
    if (
      initializer &&
      (initializer.getKind() === SyntaxKind.ArrowFunction ||
        initializer.getKind() === SyntaxKind.FunctionExpression)
    ) {
      const func =
        initializer.asKindOrThrow(SyntaxKind.ArrowFunction) ||
        initializer.asKindOrThrow(SyntaxKind.FunctionExpression);
      const name = varDecl.getName();
      // Heuristic: PascalCase usually means Component, use* means Hook
      const type = name.match(/^[A-Z]/)
        ? "Component"
        : name.startsWith("use")
          ? "Hook"
          : "Function";

      signatures.push({
        name,
        type,
        propsOrArgs: func
          .getParameters()
          .map(
            (p) =>
              p.getName() +
              (p.getTypeNode() ? `: ${p.getTypeNode()?.getText()}` : ""),
          ),
        returnType: func.getReturnTypeNode()?.getText() || "any",
        isExported: varDecl.getVariableStatement()?.isExported() || false,
      });
    }
  });

  return signatures;
}

/**
 *
 */
export function getStagedASTDiff(): FileASTDiff[] {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { isolatedModules: true },
  });

  let stagedFiles: string[] = [];
  try {
    stagedFiles = execSync("git diff --cached --name-only --diff-filter=ACM")
      .toString()
      .trim()
      .split("\n")
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  } catch (e) {
    return [];
  }

  if (stagedFiles.length === 0 || stagedFiles[0] === "") return [];

  const diffs: FileASTDiff[] = [];

  for (const filePath of stagedFiles) {
    let oldContent = "";
    try {
      oldContent = execSync(`git show HEAD:${filePath}`, {
        stdio: ["pipe", "pipe", "ignore"],
      }).toString();
    } catch (e) {
      // New file, HEAD has no content
      oldContent = "";
    }

    let newContent = "";
    try {
      newContent = execSync(`git show :${filePath}`).toString(); // Reads from index
    } catch (e) {
      continue;
    }

    const oldSource = project.createSourceFile(`old_${filePath}`, oldContent, {
      overwrite: true,
    });
    const newSource = project.createSourceFile(`new_${filePath}`, newContent, {
      overwrite: true,
    });

    const oldSignatures = extractSignatures(oldSource);
    const newSignatures = extractSignatures(newSource);

    const added = newSignatures.filter(
      (ns) => !oldSignatures.some((os) => os.name === ns.name),
    );
    const removed = oldSignatures.filter(
      (os) => !newSignatures.some((ns) => ns.name === os.name),
    );

    const modified: { old: SemanticSignature; new: SemanticSignature }[] = [];
    newSignatures.forEach((ns) => {
      const os = oldSignatures.find((o) => o.name === ns.name);
      if (
        os &&
        (JSON.stringify(os.propsOrArgs) !== JSON.stringify(ns.propsOrArgs) ||
          os.returnType !== ns.returnType)
      ) {
        modified.push({ old: os, new: ns });
      }
    });

    if (added.length > 0 || removed.length > 0 || modified.length > 0) {
      diffs.push({ filePath, added, removed, modified });
    }
  }

  return diffs;
}

/**
 *
 */
export function formatDiffForLLM(diffs: FileASTDiff[]): string {
  let output = "";
  for (const diff of diffs) {
    output += `\nFile: ${diff.filePath}\n`;
    diff.added.forEach(
      (s) =>
        (output += `[ADDED] ${s.type} ${s.name}(${s.propsOrArgs.join(", ")}) -> ${s.returnType}\n`),
    );
    diff.removed.forEach((s) => (output += `[REMOVED] ${s.type} ${s.name}\n`));
    diff.modified.forEach(
      (m) =>
        (output += `[MODIFIED] ${m.new.type} ${m.new.name}: Props changed from (${m.old.propsOrArgs.join(", ")}) to (${m.new.propsOrArgs.join(", ")})\n`),
    );
  }
  return output.trim();
}
