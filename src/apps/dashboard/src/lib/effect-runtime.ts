import { ManagedRuntime, Layer, Context } from "effect";
import { Images } from "@/lib/services/image-service";
import { NodeSdk } from "@effect/opentelemetry";
import { SpanProcessor, ReadableSpan, } from "@opentelemetry/sdk-trace-node";
import { Axiom } from "@axiomhq/js";
import { LocalFiles } from "./services/files-service";

const AXIOM_DATASET = "stoquify-dev";
const AXIOM_API_TOKEN = "xaat-04edf73a-f303-44b7-a98e-6d5db5b54655";

// Custom span processor that sends to Axiom browser SDK
class AxiomSpanProcessor implements SpanProcessor {
  constructor(private axiom: Axiom) { }

  onStart() { }

  onEnd(span: ReadableSpan) {
    // Convert OpenTelemetry span to Axiom event
    this.axiom.ingest(AXIOM_DATASET, [
      {
        span_name: span.name,
        trace_id: span.spanContext().traceId,
        span_id: span.spanContext().spanId,
        duration_ms: (span.endTime[0] - span.startTime[0]) * 1000,
        ...span.attributes, // wide event attributes
        timestamp: new Date(span.startTime[0] * 1000).toISOString(),
      },
    ]);
  }

  async forceFlush() {
    return this.axiom.flush().then(() => { });
  }
  async shutdown() {
    return this.axiom.flush().then(() => { });
  }
}
const axiom = new Axiom({
  token: AXIOM_API_TOKEN,
});

const AxiomBrowserTracingLive = NodeSdk.layer(() => ({
  resource: { serviceName: "my-app-pwa" },
  spanProcessor: new AxiomSpanProcessor(axiom),
}));

const Dependencies = Layer.mergeAll(LocalFiles.layer, Images.layer, AxiomBrowserTracingLive);

export const effectRuntime = ManagedRuntime.make(Dependencies);
