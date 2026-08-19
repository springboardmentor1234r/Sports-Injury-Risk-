/**
 * Central place for reporting uncaught errors from the root error boundary.
 * Currently just logs to the console with structured context; swap this out
 * for a real error-tracking service (Sentry, etc.) if you add one later.
 */
export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[app-error]", error, {
    source: "react_error_boundary",
    route: window.location.pathname,
    ...context,
  });
}
