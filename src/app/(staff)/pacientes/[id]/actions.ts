"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// Guarda la ruta (en Storage) de la foto de perfil del paciente.
export async function setFotoPaciente(
  pacienteId: string,
  path: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("pacientes")
    .update({ foto_url: path })
    .eq("id", pacienteId);

  if (error) {
    return { error: "No se pudo guardar la foto." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}
