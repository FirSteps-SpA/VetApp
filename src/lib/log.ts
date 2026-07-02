// Logging de errores centralizado. Punto único de integración con un servicio
// externo (Sentry, LogRocket, etc.): añade aquí la llamada a captureException.
export function logError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.error("[VetApp]", error, context ?? {});

  // Integración opcional (ejemplo):
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.captureException(error, { extra: context });
}
