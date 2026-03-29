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

  public success<T>(data: T, humanMessage?: string): void {
    if (this.isJson) {
      const response: CliSuccessResponse<T> = {
        status: "success",
        data,
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    } else {
      if (humanMessage) {
        console.log(`✅ ${humanMessage}`);
      } else {
        console.log(data);
      }
    }
  }

  public fail(
    error: Error | string,
    code: string = "general_error",
    suggestedCommand?: string,
  ): void {
    const message = error instanceof Error ? error.message : error;
    if (this.isJson) {
      const response: CliErrorResponse = {
        status: "error",
        code,
        message,
        ...(suggestedCommand ? { suggestedCommand } : {}),
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    } else {
      console.error(`❌ Error: ${message}`);
      if (suggestedCommand) {
        console.error(`\nRun: ${suggestedCommand}`);
      }
    }
  }
}

export function isHeadless(): boolean {
  if (!process.stdout.isTTY) return true;
  if (process.env.CI) return true;
  if (process.env.NON_INTERACTIVE) return true;
  if (process.env.NO_COLOR) return true;
  return false;
}
