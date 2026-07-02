"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface CrearVacunaInput {
  pacienteId: string;
  consultaId?: string | null;
  nombre_vacuna: string;
  laboratorio?: string;
  lote?: string;
  fecha_aplicacion: string;
  proxima_dosis?: string;
  notas?: string;
}

export async function crearVacuna(
  input: CrearVacunaInput,
): Promise<{ error: string | null }> {
  if (!input.nombre_vacuna?.trim()) {
    return { error: "El nombre de la vacuna es obligatorio." };
  }
  if (!input.fecha_aplicacion) {
    return { error: "La fecha de aplicación es obligatoria." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  // estado_alerta lo calcula un trigger a partir de proxima_dosis.
  const { error } = await supabase.from("vacunas").insert({
    paciente_id: input.pacienteId,
    consulta_id: input.consultaId ?? null,
    veterinario_id: user.id,
    nombre_vacuna: input.nombre_vacuna.trim(),
    laboratorio: input.laboratorio?.trim() || null,
    lote: input.lote?.trim() || null,
    fecha_aplicacion: input.fecha_aplicacion,
    proxima_dosis: input.proxima_dosis || null,
    notas: input.notas?.trim() || null,
  });

  if (error) return { error: "No se pudo registrar la vacuna." };

  revalidatePath(`/pacientes/${input.pacienteId}`);
  return { error: null };
}

export async function eliminarVacuna(
  vacunaId: string,
  pacienteId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("vacunas").delete().eq("id", vacunaId);
  if (error) return { error: "No se pudo eliminar la vacuna." };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}
