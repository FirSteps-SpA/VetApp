"use server";

import { registrarAcceso } from "@/lib/privacidad/registro";

// Descarga de un documento por el dueño (spec 7). La base verifica que la
// mascota sea suya y registra la descarga en la clínica de la mascota.
export async function registrarDescargaPortal(
  pacienteId: string,
  tipo: "historial" | "receta",
  detalle: Record<string, unknown> = {},
): Promise<{ ok: boolean }> {
  return {
    ok: await registrarAcceso("descargar_portal", { paciente: pacienteId, detalle: { tipo, ...detalle } }),
  };
}
