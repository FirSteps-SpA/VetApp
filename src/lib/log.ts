import * as Sentry from "@sentry/nextjs";

// Logging de errores centralizado: consola + Sentry. Punto único de
// integración; los error boundaries y el código de servidor llaman aquí.
export function logError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.error("[VetApp]", error, context ?? {});

  Sentry.captureException(error, { extra: context });
}
