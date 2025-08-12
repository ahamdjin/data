import { env } from "@/config/env";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { resourceFromAttributes } from "@opentelemetry/resources";

let started = false;

export async function startOtelOnce() {
  if (started || !env.flags.ENABLE_OBSERVABILITY) return;
  started = true;

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const exporter = env.server.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({ url: `${env.server.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` })
    : undefined;

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: env.server.OTEL_SERVICE_NAME,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.server.NODE_ENV,
    }),
    traceExporter: exporter,
  });

  await sdk.start();
}
