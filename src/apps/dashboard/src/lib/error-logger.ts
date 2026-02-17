import { Axiom } from "@axiomhq/js";

const AXIOM_DATASET = "stoquify-dev";
const AXIOM_API_TOKEN = "xaat-04edf73a-f303-44b7-a98e-6d5db5b54655";

const axiom = new Axiom({
  token: AXIOM_API_TOKEN,
});

export type ErrorSeverity = "schema" | "network" | "runtime";

export interface ErrorContext {
  severity: ErrorSeverity;
  query?: string;
  component?: string;
  userAction?: string;
  additionalInfo?: Record<string, unknown>;
}

function detectSeverity(error: Error): ErrorSeverity {
  const message = error.message.toLowerCase();

  if (
    message.includes("type side transformation") ||
    message.includes("error parsing sql") ||
    message.includes("schema")
  ) {
    return "schema";
  }

  if (
    error.name === "TypeError" ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    return "network";
  }

  return "runtime";
}

export async function logError(
  error: Error,
  context: ErrorContext,
): Promise<void> {
  const severity = context.severity || detectSeverity(error);

  axiom.ingest(AXIOM_DATASET, [
    {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack?.split("\n").slice(0, 10).join("\n"),
      severity,
      query: context.query,
      component: context.component,
      user_action: context.userAction,
      ...context.additionalInfo,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "server",
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    },
  ]);
}

export function wrapQuery<T>(
  queryFn: () => T,
  queryName: string,
  componentName: string,
): T | null {
  try {
    const result = queryFn();
    return result
  } catch (error) {
    console.log(`[wrapQuery] Error in ${queryName} (${componentName}):`, error);
    if (error instanceof Error) {
      logError(error, {
        severity: "schema",
        query: queryName,
        component: componentName,
      });
    }
    return null;
  }
}
