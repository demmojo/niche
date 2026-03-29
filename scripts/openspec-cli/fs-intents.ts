import * as fs from "fs";
import * as path from "path";
import { TerminalPresenter } from "./presenter.js";

export type FsIntent =
  | { kind: "createFile"; absolutePath: string; content: string }
  | { kind: "mkdir"; absolutePath: string }
  | { kind: "deleteFile"; absolutePath: string }
  | { kind: "deleteDir"; absolutePath: string }
  | { kind: "renameDir"; oldPath: string; newPath: string };

export class FsExecutor {
  constructor(
    private readonly isDryRun: boolean,
    private readonly presenter: TerminalPresenter,
  ) {}

  public execute(intents: FsIntent[]): void {
    if (this.isDryRun) {
      this.presenter.log(
        "--- DRY RUN: The following operations would be executed ---",
      );
    }

    for (const intent of intents) {
      switch (intent.kind) {
        case "createFile":
          if (this.isDryRun) {
            this.presenter.log(
              `[createFile] ${path.relative(process.cwd(), intent.absolutePath)} (${intent.content.length} bytes)`,
            );
          } else {
            const dir = path.dirname(intent.absolutePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(intent.absolutePath, intent.content, "utf-8");
          }
          break;

        case "mkdir":
          if (this.isDryRun) {
            this.presenter.log(
              `[mkdir] ${path.relative(process.cwd(), intent.absolutePath)}`,
            );
          } else {
            if (!fs.existsSync(intent.absolutePath)) {
              fs.mkdirSync(intent.absolutePath, { recursive: true });
            }
          }
          break;

        case "deleteFile":
          if (this.isDryRun) {
            this.presenter.log(
              `[deleteFile] ${path.relative(process.cwd(), intent.absolutePath)}`,
            );
          } else {
            if (fs.existsSync(intent.absolutePath)) {
              fs.rmSync(intent.absolutePath, { force: true });
            }
          }
          break;

        case "deleteDir":
          if (this.isDryRun) {
            this.presenter.log(
              `[deleteDir] ${path.relative(process.cwd(), intent.absolutePath)}`,
            );
          } else {
            if (fs.existsSync(intent.absolutePath)) {
              fs.rmSync(intent.absolutePath, { recursive: true, force: true });
            }
          }
          break;

        case "renameDir":
          if (this.isDryRun) {
            this.presenter.log(
              `[renameDir] ${path.relative(process.cwd(), intent.oldPath)} -> ${path.relative(process.cwd(), intent.newPath)}`,
            );
          } else {
            if (fs.existsSync(intent.oldPath)) {
              const dir = path.dirname(intent.newPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.renameSync(intent.oldPath, intent.newPath);
            }
          }
          break;
      }
    }
  }
}
