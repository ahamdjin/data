import { context, trace } from "@opentelemetry/api";

export function getTraceIds() {
  const span = trace.getSpan(context.active());
  const ctx = span?.spanContext();
  return ctx ? { traceId: ctx.traceId, spanId: ctx.spanId } : {};
}

export function newRequestId() {
  return Math.random().toString(36).slice(2, 10);
}
