import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("datai");

export async function withSpan<T>(name: string, attrs: Record<string, any>, fn: () => Promise<T>): Promise<T> {
  return await tracer.startActiveSpan(name, async span => {
    try {
      for (const [k, v] of Object.entries(attrs)) {
        span.setAttribute(k, typeof v === "string" ? v : JSON.stringify(v));
      }
      const out = await fn();
      span.end();
      return out;
    } catch (e: any) {
      span.recordException(e);
      span.setAttribute("error", true);
      span.end();
      throw e;
    }
  });
}
