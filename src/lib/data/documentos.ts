import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DocumentoEmitido } from "@/lib/types/db";

// Traza de documentos legales/certificados emitidos para un paciente
// (más recientes primero). Solo-staff por RLS.
export async function getDocumentosEmitidos(
  pacienteId: string,
): Promise<DocumentoEmitido[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("documentos_emitidos")
    .select("id, paciente_id, dueno_id, tipo, emitido_por, emitido_en, datos")
    .eq("paciente_id", pacienteId)
    .order("emitido_en", { ascending: false });
  return (data as DocumentoEmitido[] | null) ?? [];
}
