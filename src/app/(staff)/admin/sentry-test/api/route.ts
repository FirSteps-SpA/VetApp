// TEMPORAL: error de servidor para probar Sentry (onRequestError). Quitar antes de mergear.
export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry test: error en route handler (servidor)");
}
