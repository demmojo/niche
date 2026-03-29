import * as fs from "fs";
import * as path from "path";
import { FsExecutor, FsIntent } from "./fs-intents.js";
import { TerminalPresenter, isHeadless } from "./presenter.js";

function readStdinSafe(): string | null {
  try {
    if (process.stdin.isTTY) return null;
    return fs.readFileSync(0, "utf-8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EAGAIN") {
      return null;
    }
    throw new Error(
      `Failed to read stdin: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
