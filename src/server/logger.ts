import pino from "pino";
import pinoHttp from "pino-http";

const isProd = process.env.NODE_ENV === "production";

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      }),
});

// Wrapper to match console interface for easy migration
export const logger = {
  info: (...args: any[]) => {
    if (typeof args[0] === "string") {
      (pinoLogger.info as any)(args[0], ...args.slice(1));
    } else {
      (pinoLogger.info as any)(args[0]);
    }
  },
  warn: (...args: any[]) => {
    if (typeof args[0] === "string") {
      (pinoLogger.warn as any)(
        args.length > 1 ? args[1] : {},
        args[0],
        ...args.slice(2),
      );
    } else {
      (pinoLogger.warn as any)(args[0], ...args.slice(1));
    }
  },
  error: (...args: any[]) => {
    if (typeof args[0] === "string") {
      (pinoLogger.error as any)(
        args.length > 1 ? args[1] : {},
        args[0],
        ...args.slice(2),
      );
    } else {
      (pinoLogger.error as any)(args[0], ...args.slice(1));
    }
  },
};

export const httpLogger = pinoHttp({
  logger: pinoLogger,
  autoLogging: {
    ignore: (req) => req.url === "/api/health" || req.url === "/healthz",
  },
});
