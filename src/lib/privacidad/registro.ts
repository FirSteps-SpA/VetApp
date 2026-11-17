import "server-only";

import { logError } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

// Registro de accesos (spec 7). La base lo escribe siempre a nombre de la
// sesión y en la clínica del dato (`registrar_acceso`); aquí solo se arma la
// llamada. Devuelve false si no se pudo registrar (y lo informa a Sentry).
export type AccionAcceso = "ver_ficha" | "exportar_documento" | "descargar_portal" | "exportar_datos";

export async function registrarAcceso(
  accion: AccionAcceso,
  dato: { paciente?: string; dueno?: string; detalle?: Record<string, unknown> },
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.rpc("registrar_acceso", {
    p_accion: accion,
    p_paciente: dato.paciente ?? null,
    p_dueno: dato.dueno ?? null,
    p_detalle: dato.detalle ?? {},
  });
  if (error) {
    logError(new Error(`registrar_acceso ${accion}: ${error.message}`), { contexto: "registro-accesos" });
    return false;
  }
  return true;
}
