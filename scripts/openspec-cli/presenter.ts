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

export class TerminalPresenter {
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
            throw e;
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

export function isHeadless(): boolean {
  if (!process.stdout.isTTY) return true;
  if (process.env.CI) return true;
  if (process.env.NON_INTERACTIVE) return true;
  if (process.env.NO_COLOR) return true;
  return false;
}
