"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Dueno } from "@/lib/types/db";

export interface EditarDuenoState {
  error: string | null;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

// Actualiza un dueño. `duenoId` y `pacienteId` se enlazan con .bind().
export async function actualizarDueno(
  duenoId: string,
  pacienteId: string,
  _prev: EditarDuenoState,
  formData: FormData,
): Promise<EditarDuenoState> {
  const nombre = str(formData, "nombre");
  const telefono = str(formData, "telefono");

  if (!nombre || !telefono) {
    return { error: "El dueño requiere nombre y teléfono." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("duenos")
    .update({
      nombre,
      telefono,
      email: str(formData, "email") || null,
      direccion: str(formData, "direccion") || null,
      notas: str(formData, "notas") || null,
    })
    .eq("id", duenoId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un dueño con ese email."
          : "No se pudo actualizar el dueño.",
    };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  redirect(`/pacientes/${pacienteId}`);
}

// Búsqueda de dueños por nombre, teléfono o email (para vincular).
export async function buscarDuenos(q: string): Promise<Dueno[]> {
  const term = q.trim();
  if (!term) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("duenos")
    .select("*")
    .or(`nombre.ilike.%${term}%,telefono.ilike.%${term}%,email.ilike.%${term}%`)
    .order("nombre")
    .limit(20);

  if (error) {
    console.error("buscarDuenos:", error.message);
    return [];
  }
  return (data as Dueno[]) ?? [];
}

// Vincula un dueño existente al paciente (no principal).
export async function vincularDueno(
  pacienteId: string,
  duenoId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("paciente_duenos").insert({
    paciente_id: pacienteId,
    dueno_id: duenoId,
    es_principal: false,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ese dueño ya está vinculado al paciente."
          : "No se pudo vincular el dueño.",
    };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}

// Crea un dueño nuevo y lo vincula al paciente.
export async function crearYVincularDueno(
  pacienteId: string,
  input: { nombre: string; telefono: string; email?: string; direccion?: string },
): Promise<{ error: string | null }> {
  if (!input.nombre?.trim() || !input.telefono?.trim()) {
    return { error: "El dueño requiere nombre y teléfono." };
  }

  const supabase = createClient();
  const { data: dueno, error: duenoError } = await supabase
    .from("duenos")
    .insert({
      nombre: input.nombre.trim(),
      telefono: input.telefono.trim(),
      email: input.email?.trim() || null,
      direccion: input.direccion?.trim() || null,
    })
    .select("id")
    .single();

  if (duenoError || !dueno) {
    return {
      error:
        duenoError?.code === "23505"
          ? "Ya existe un dueño con ese email."
          : "No se pudo crear el dueño.",
    };
  }

  return vincularDueno(pacienteId, dueno.id);
}

// Marca un dueño como principal (desmarca el resto primero por el índice único).
export async function marcarPrincipal(
  pacienteId: string,
  duenoId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error: clearError } = await supabase
    .from("paciente_duenos")
    .update({ es_principal: false })
    .eq("paciente_id", pacienteId)
    .eq("es_principal", true);

  if (clearError) return { error: "No se pudo actualizar el principal." };

  const { error } = await supabase
    .from("paciente_duenos")
    .update({ es_principal: true })
    .eq("paciente_id", pacienteId)
    .eq("dueno_id", duenoId);

  if (error) return { error: "No se pudo marcar el principal." };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}

// Desvincula un dueño. No permite quitar el último; si era principal, promueve a otro.
export async function desvincularDueno(
  pacienteId: string,
  duenoId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: links } = await supabase
    .from("paciente_duenos")
    .select("dueno_id, es_principal")
    .eq("paciente_id", pacienteId);

  if (!links || links.length <= 1) {
    return { error: "El paciente debe conservar al menos un dueño." };
  }

  const eliminado = links.find((l) => l.dueno_id === duenoId);

  const { error } = await supabase
    .from("paciente_duenos")
    .delete()
    .eq("paciente_id", pacienteId)
    .eq("dueno_id", duenoId);

  if (error) return { error: "No se pudo desvincular el dueño." };

  // Si se quitó el principal, promover al primer dueño restante.
  if (eliminado?.es_principal) {
    const otro = links.find((l) => l.dueno_id !== duenoId);
    if (otro) await marcarPrincipal(pacienteId, otro.dueno_id as string);
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}
