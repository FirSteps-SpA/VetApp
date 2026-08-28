"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TipoDocumentoLegal } from "@/lib/types/db";

// Registra la emisión de un documento legal/certificado (traza, sin el PDF).
export async function registrarDocumentoEmitido(input: {
  pacienteId: string;
  duenoId: string | null;
  tipo: TipoDocumentoLegal;
  datos: Record<string, unknown>;
}): Promise<{ error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("documentos_emitidos").insert({
    paciente_id: input.pacienteId,
    dueno_id: input.duenoId,
    tipo: input.tipo,
    emitido_por: user?.id ?? null,
    datos: input.datos,
  });

  if (error) return { error: "No se pudo registrar la emisión." };

  revalidatePath(`/pacientes/${input.pacienteId}`);
  return { error: null };
}
