"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ESPECIES, SEXOS, type Especie, type Sexo } from "@/lib/types/db";

export interface FormState {
  error: string | null;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

export async function crearPaciente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // --- Dueño ---
  const duenoNombre = str(formData, "dueno_nombre");
  const duenoTelefono = str(formData, "dueno_telefono");
  const duenoEmail = str(formData, "dueno_email");
  const duenoDireccion = str(formData, "dueno_direccion");

  // --- Paciente ---
  const nombre = str(formData, "nombre");
  const especie = str(formData, "especie") as Especie;
  const raza = str(formData, "raza");
  const fechaNacimiento = str(formData, "fecha_nacimiento");
  const sexo = str(formData, "sexo") as Sexo | "";
  const castrado = formData.get("castrado") === "on";
  const pesoRaw = str(formData, "peso_kg");
  const notas = str(formData, "notas");

  // --- Validación ---
  if (!duenoNombre || !duenoTelefono) {
    return { error: "El dueño requiere nombre y teléfono." };
  }
  if (!nombre) {
    return { error: "El paciente requiere un nombre." };
  }
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

  // 1) Crear dueño.
  const { data: dueno, error: duenoError } = await supabase
    .from("duenos")
    .insert({
      nombre: duenoNombre,
      telefono: duenoTelefono,
      email: duenoEmail || null,
      direccion: duenoDireccion || null,
    })
    .select("id")
    .single();

  if (duenoError || !dueno) {
    return {
      error:
        duenoError?.code === "23505"
          ? "Ya existe un dueño con ese email."
          : "No se pudo crear el dueño. Intenta nuevamente.",
    };
  }

  // 2) Crear paciente (numero_ficha lo asigna un trigger).
  const { data: paciente, error: pacienteError } = await supabase
    .from("pacientes")
    .insert({
      nombre,
      especie,
      raza: raza || null,
      fecha_nacimiento: fechaNacimiento || null,
      sexo: sexo || null,
      castrado,
      peso_kg: pesoKg,
      notas: notas || null,
    })
    .select("id")
    .single();

  if (pacienteError || !paciente) {
    // Limpieza: evitar dueño huérfano si falla el paciente.
    await supabase.from("duenos").delete().eq("id", dueno.id);
    return { error: "No se pudo crear el paciente. Intenta nuevamente." };
  }

  // 3) Vincular como dueño principal.
  const { error: linkError } = await supabase.from("paciente_duenos").insert({
    paciente_id: paciente.id,
    dueno_id: dueno.id,
    es_principal: true,
  });

  if (linkError) {
    return { error: "Paciente creado, pero falló el vínculo con el dueño." };
  }

  revalidatePath("/pacientes");
  redirect(`/pacientes/${paciente.id}`);
}
