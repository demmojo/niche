import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { TerminalPresenter } from "./presenter.js";

export type FsIntent =
  | { kind: "createFile"; absolutePath: string; content: string }
  | { kind: "mkdir"; absolutePath: string }
  | { kind: "deleteFile"; absolutePath: string }
  | { kind: "deleteDir"; absolutePath: string }
  | { kind: "renameDir"; oldPath: string; newPath: string }
  | { kind: "gitMove"; oldPath: string; newPath: string };

export class FsExecutor {
  constructor(
    private readonly isDryRun: boolean,
    private readonly presenter: TerminalPresenter,
    private readonly sandboxRoot?: string,
  ) {}

  private getSandboxPath(originalPath: string): string {
    if (!this.sandboxRoot) return originalPath;
    const cwd = process.cwd();
    if (!originalPath.startsWith(cwd)) {
      throw new Error(
        `Sandbox escape attempt: ${originalPath} is outside workspace ${cwd}`,
      );
    }
    const relative = path.relative(cwd, originalPath);
    return path.join(this.sandboxRoot, relative);
  }

  public execute(intents: FsIntent[]): void {
    if (this.isDryRun) {
      this.presenter.log(
        "--- DRY RUN: The following operations would be executed ---",
      );
    }

    for (const intent of intents) {
      switch (intent.kind) {
        case "createFile": {
          const targetPath = this.getSandboxPath(intent.absolutePath);
          if (this.isDryRun) {
            this.presenter.log(
              `[createFile] ${path.relative(process.cwd(), targetPath)} (${intent.content.length} bytes)`,
            );
          } else {
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(targetPath, intent.content, "utf-8");
          }
          break;
        }

        case "mkdir": {
          const targetPath = this.getSandboxPath(intent.absolutePath);
          if (this.isDryRun) {
            this.presenter.log(
              `[mkdir] ${path.relative(process.cwd(), targetPath)}`,
            );
          } else {
            if (!fs.existsSync(targetPath)) {
              fs.mkdirSync(targetPath, { recursive: true });
            }
          }
          break;
        }

        case "deleteFile": {
          const targetPath = this.getSandboxPath(intent.absolutePath);
          if (this.isDryRun) {
            this.presenter.log(
              `[deleteFile] ${path.relative(process.cwd(), targetPath)}`,
            );
          } else {
            if (fs.existsSync(targetPath)) {
              fs.rmSync(targetPath, { force: true });
            }
          }
          break;
        }

        case "deleteDir": {
          const targetPath = this.getSandboxPath(intent.absolutePath);
          if (this.isDryRun) {
            this.presenter.log(
              `[deleteDir] ${path.relative(process.cwd(), targetPath)}`,
            );
          } else {
            if (fs.existsSync(targetPath)) {
              fs.rmSync(targetPath, { recursive: true, force: true });
            }
          }
          break;
        }

        case "renameDir": {
          const oldPath = this.getSandboxPath(intent.oldPath);
          const newPath = this.getSandboxPath(intent.newPath);
          if (this.isDryRun) {
            this.presenter.log(
              `[renameDir] ${path.relative(process.cwd(), oldPath)} -> ${path.relative(process.cwd(), newPath)}`,
            );
          } else {
            if (fs.existsSync(oldPath)) {
              const dir = path.dirname(newPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.renameSync(oldPath, newPath);
            }
          }
          break;
        }

        case "gitMove": {
          // gitMove doesn't make sense to run isolated inside the sandbox during stage
          // It modifies the git index. We should throw if attempting to run gitMove inside a sandbox
          if (this.sandboxRoot) {
            throw new Error(
              "gitMove cannot be executed within a staging sandbox.",
            );
          }
          if (this.isDryRun) {
            this.presenter.log(
              `[gitMove] ${path.relative(process.cwd(), intent.oldPath)} -> ${path.relative(process.cwd(), intent.newPath)}`,
            );
          } else {
            if (fs.existsSync(intent.oldPath)) {
              const dir = path.dirname(intent.newPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              execSync(`git mv "${intent.oldPath}" "${intent.newPath}"`);
            }
          }
          break;
        }
      }
    }
  }
}
