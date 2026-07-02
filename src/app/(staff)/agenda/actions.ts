"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  TRANSICIONES_CITA,
  type EstadoCita,
  type Paciente,
} from "@/lib/types/db";

export interface CrearCitaInput {
  pacienteId: string;
  fecha_hora: string; // ISO
  duracion_minutos: number;
  motivo: string;
  notas?: string;
}

export async function crearCita(
  input: CrearCitaInput,
): Promise<{ error: string | null; id?: string }> {
  if (!input.pacienteId) return { error: "Selecciona un paciente." };
  if (!input.fecha_hora) return { error: "Indica fecha y hora." };
  if (!input.motivo?.trim()) return { error: "El motivo es obligatorio." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  // Dueño principal del paciente (si existe) para el contacto de la cita.
  const { data: link } = await supabase
    .from("paciente_duenos")
    .select("dueno_id")
    .eq("paciente_id", input.pacienteId)
    .eq("es_principal", true)
    .maybeSingle();

  const { data, error } = await supabase
    .from("citas")
    .insert({
      paciente_id: input.pacienteId,
      dueno_id: link?.dueno_id ?? null,
      veterinario_id: user.id,
      fecha_hora: input.fecha_hora,
      duracion_minutos: input.duracion_minutos,
      motivo: input.motivo.trim(),
      notas: input.notas?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la cita." };

  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${input.pacienteId}`);
  return { error: null, id: data.id };
}

export async function cambiarEstadoCita(
  citaId: string,
  nuevoEstado: EstadoCita,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: cita } = await supabase
    .from("citas")
    .select("estado, paciente_id")
    .eq("id", citaId)
    .maybeSingle();

  if (!cita) return { error: "Cita no encontrada." };

  const permitidas = TRANSICIONES_CITA[cita.estado as EstadoCita] ?? [];
  if (!permitidas.includes(nuevoEstado)) {
    return { error: "Transición de estado no permitida." };
  }

  const { error } = await supabase
    .from("citas")
    .update({ estado: nuevoEstado })
    .eq("id", citaId);

  if (error) return { error: "No se pudo actualizar la cita." };

  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${cita.paciente_id}`);
  return { error: null };
}

// Búsqueda de pacientes para el selector de nueva cita (callable desde cliente).
export async function buscarPacientesAgenda(q: string): Promise<Paciente[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("buscar_pacientes", {
    q: q.trim() || null,
  });
  if (error) {
    console.error("buscarPacientesAgenda:", error.message);
    return [];
  }
  return (data as Paciente[]) ?? [];
}
