import pino from "pino";
import { env } from "@/config/env";

export const logger = pino({
  level: env.server.LOG_LEVEL,
  base: null,
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { singleLine: true, translateTime: "SYS:isoTime" } }
    : undefined,
});

/** Child logger with contextual bindings */
export function childLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}
