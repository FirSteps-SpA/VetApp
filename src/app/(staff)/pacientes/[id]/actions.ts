"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ESPECIES, SEXOS, type Especie, type Sexo } from "@/lib/types/db";

export interface EditarPacienteState {
  error: string | null;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

// Actualiza los datos del paciente. `pacienteId` se enlaza con .bind().
export async function actualizarPaciente(
  pacienteId: string,
  _prev: EditarPacienteState,
  formData: FormData,
): Promise<EditarPacienteState> {
  const nombre = str(formData, "nombre");
  const especie = str(formData, "especie") as Especie;
  const sexo = str(formData, "sexo") as Sexo | "";
  const pesoRaw = str(formData, "peso_kg");

  if (!nombre) return { error: "El paciente requiere un nombre." };
  if (!ESPECIES.some((e) => e.value === especie)) {
    return { error: "Selecciona una especie válida." };
  }
  if (sexo && !SEXOS.some((s) => s.value === sexo)) {
    return { error: "Sexo inválido." };
  }
  let pesoKg: number | null = null;
  if (pesoRaw) {
    pesoKg = Number(pesoRaw);
    if (Number.isNaN(pesoKg) || pesoKg <= 0) {
      return { error: "El peso debe ser un número positivo." };
    }
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("pacientes")
    .update({
      nombre,
      especie,
      raza: str(formData, "raza") || null,
      fecha_nacimiento: str(formData, "fecha_nacimiento") || null,
      sexo: sexo || null,
      castrado: formData.get("castrado") === "on",
      peso_kg: pesoKg,
      notas: str(formData, "notas") || null,
      activo: formData.get("activo") === "on",
    })
    .eq("id", pacienteId);

  if (error) {
    return { error: "No se pudo actualizar el paciente." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  redirect(`/pacientes/${pacienteId}`);
}

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
