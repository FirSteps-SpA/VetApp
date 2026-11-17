"use server";

import { registrarAcceso } from "@/lib/privacidad/registro";

export type TipoDocumentoExportado =
  | "historial"
  | "receta"
  | "vacunacion"
  | "derivacion"
  | "autorizacion";

// Antes de descargar o imprimir un documento del paciente: si no queda en el
// registro de accesos, la exportación no sigue (spec 7).
export async function registrarExportacion(
  pacienteId: string,
  tipo: TipoDocumentoExportado,
  detalle: Record<string, unknown> = {},
): Promise<{ ok: boolean }> {
  return { ok: await registrarAcceso("exportar_documento", { paciente: pacienteId, detalle: { tipo, ...detalle } }) };
}
