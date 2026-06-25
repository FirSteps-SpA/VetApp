"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { TIPOS_EXAMEN, type TipoExamen } from "@/lib/types/db";

export interface CrearExamenInput {
  pacienteId: string;
  consultaId?: string | null;
  tipo: TipoExamen;
  nombre: string;
  descripcion?: string;
  fecha: string;
  interno?: boolean;
  archivo_url: string;
  archivo_nombre: string;
  archivo_tipo: string;
  archivo_tamanio_bytes: number;
}

export async function crearExamen(
  input: CrearExamenInput,
): Promise<{ error: string | null }> {
  if (!TIPOS_EXAMEN.some((t) => t.value === input.tipo)) {
    return { error: "Tipo de examen inválido." };
  }
  if (!input.nombre?.trim()) return { error: "El nombre es obligatorio." };
  if (!input.fecha) return { error: "La fecha es obligatoria." };

  const supabase = createClient();
  const { error } = await supabase.from("examenes").insert({
    paciente_id: input.pacienteId,
    consulta_id: input.consultaId ?? null,
    tipo: input.tipo,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    fecha: input.fecha,
    interno: input.interno ?? false,
    archivo_url: input.archivo_url,
    archivo_nombre: input.archivo_nombre,
    archivo_tipo: input.archivo_tipo,
    archivo_tamanio_bytes: input.archivo_tamanio_bytes,
  });

  if (error) {
    return { error: "No se pudo registrar el examen." };
  }

  revalidatePath(`/pacientes/${input.pacienteId}`);
  return { error: null };
}

export async function eliminarExamen(
  examenId: string,
  pacienteId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: examen } = await supabase
    .from("examenes")
    .select("archivo_url")
    .eq("id", examenId)
    .maybeSingle();

  // Borra el archivo de Storage (si existe) y luego el registro.
  if (examen?.archivo_url) {
    await supabase.storage
      .from("examenes")
      .remove([examen.archivo_url as string]);
  }

  const { error } = await supabase.from("examenes").delete().eq("id", examenId);
  if (error) {
    return { error: "No se pudo eliminar el examen." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}
