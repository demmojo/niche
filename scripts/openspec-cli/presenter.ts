export interface CliSuccessResponse<T> {
  status: "success";
  data: T;
  warnings?: string[];
}

export interface CliErrorResponse {
  status: "error";
  code: string;
  message: string;
  suggestedCommand?: string;
}

export interface Presenter {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success<T>(data: T, humanMessage?: string): Promise<void>;
  fail(
    error: Error | string,
    code?: string,
    suggestedCommand?: string,
  ): Promise<void>;
  safeExit(code: number, jsonStdout?: string): Promise<void>;
}

export class TerminalPresenter implements Presenter {
  constructor(
    private readonly isNonInteractive: boolean,
    private readonly isJson: boolean,
  ) {}

  public log(message: string): void {
    if (this.isJson) {
      // In JSON mode, all human-readable logs go to stderr to prevent corrupting stdout.
      console.error(message);
    } else {
      console.log(message);
    }
  }

  public warn(message: string): void {
    console.error(message);
  }

  public error(message: string): void {
    console.error(message);
  }

  public async success<T>(data: T, humanMessage?: string): Promise<void> {
    if (this.isJson) {
      const response: CliSuccessResponse<T> = {
        status: "success",
        data,
      };
      await this.safeExit(0, JSON.stringify(response) + "\n");
    } else {
      if (humanMessage) {
        console.log(`✅ ${humanMessage}`);
      } else {
        console.log(data);
      }
      await this.safeExit(0);
    }
  }

  public async fail(
    error: Error | string,
    code: string = "general_error",
    suggestedCommand?: string,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : error;
    if (this.isJson) {
      const response: CliErrorResponse = {
        status: "error",
        code,
        message,
        ...(suggestedCommand ? { suggestedCommand } : {}),
      };
      await this.safeExit(1, JSON.stringify(response) + "\n");
    } else {
      console.error(`❌ Error: ${message}`);
      if (suggestedCommand) {
        console.error(`\nRun: ${suggestedCommand}`);
      }
      await this.safeExit(1);
    }
  }

  public async safeExit(code: number, jsonStdout?: string): Promise<void> {
    return new Promise((resolve) => {
      let pending = 2;
      const maybeExit = () => {
        pending--;
        if (pending === 0) {
          try {
            process.exit(code);
            resolve(); // if process.exit is mocked to not throw, resolve the promise so tests don't hang
          } catch (e) {
            resolve();
            // Do not re-throw here because we are in a stream callback, which will cause an Unhandled Exception.
          }
        }
      };

      if (jsonStdout && this.isJson) {
        process.stdout.write(jsonStdout, maybeExit);
      } else {
        process.stdout.write("", maybeExit);
      }

      process.stderr.write("", maybeExit);
    });
  }
}

export class CloudLogPresenter implements Presenter {
  constructor(private readonly isJson: boolean = true) {}

  public log(message: string): void {
    console.log(JSON.stringify({ severity: "INFO", message }));
  }

  public warn(message: string): void {
    console.error(JSON.stringify({ severity: "WARNING", message }));
  }

  public error(message: string): void {
    console.error(JSON.stringify({ severity: "ERROR", message }));
  }

  public async success<T>(data: T, humanMessage?: string): Promise<void> {
    const payload = {
      severity: "INFO",
      status: "success",
      message: humanMessage,
      data,
    };
    console.log(JSON.stringify(payload));
    await this.safeExit(0);
  }

  public async fail(
    error: Error | string,
    code: string = "general_error",
    suggestedCommand?: string,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : error;
    const payload = {
      severity: "ERROR",
      status: "error",
      code,
      message,
      suggestedCommand,
    };
    console.error(JSON.stringify(payload));
    await this.safeExit(1);
  }

  public async safeExit(code: number, jsonStdout?: string): Promise<void> {
    if (jsonStdout) {
      console.log(jsonStdout.trim());
    }
    process.exit(code);
  }
}

export function isHeadless(): boolean {
  if (!process.stdout.isTTY) return true;
  if (process.env.CI) return true;
  if (process.env.NON_INTERACTIVE) return true;
  if (process.env.NO_COLOR) return true;
  return false;
}

export const setupEpipeHandler = () => {
  process.stdout.on("error", (err: any) => {
    if (err.code === "EPIPE") {
      process.exit(0);
    }
  });
};

export const emitPayload = (payload: any, options?: { dumpDir?: string }) => {
  const payloadStr = JSON.stringify(payload);

  if (payloadStr.length > 100 * 1024 && options?.dumpDir) {
    const dumpPath = path.join(options.dumpDir, `payload-${Date.now()}.json`);
    fs.writeFileSync(dumpPath, payloadStr, { flag: "wx", mode: 0o600 });
    process.stdout.write(JSON.stringify({ payloadDumpPath: dumpPath }) + "\n");
  } else {
    process.stdout.write(payloadStr + "\n");
  }
};
