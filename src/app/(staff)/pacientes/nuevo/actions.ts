"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { tipoConflictoUnico } from "@/lib/db-errors";
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
  const duenoModo = str(formData, "dueno_modo") || "nuevo";
  const duenoIdExistente = str(formData, "dueno_id");
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
  const usarExistente = duenoModo === "existente";
  if (usarExistente) {
    if (!duenoIdExistente) {
      return { error: "Selecciona un dueño existente." };
    }
  } else if (!duenoNombre || !duenoTelefono) {
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

  // 1) Resolver el dueño: existente o nuevo.
  let duenoId: string;
  if (usarExistente) {
    duenoId = duenoIdExistente;
  } else {
    const { data: dueno, error: duenoError } = await supabase
      .from("duenos")
      .insert({
        nombre: duenoNombre,
        rut: str(formData, "dueno_rut") || null,
        telefono: duenoTelefono,
        email: duenoEmail || null,
        direccion: duenoDireccion || null,
      })
      .select("id")
      .single();

    if (duenoError || !dueno) {
      const conflicto = tipoConflictoUnico(duenoError);
      return {
        error:
          conflicto === "rut"
            ? "El RUT ya está registrado en otro dueño."
            : conflicto === "email"
              ? "Ya existe un dueño con ese email."
              : "No se pudo crear el dueño. Intenta nuevamente.",
      };
    }
    duenoId = dueno.id;
  }

  // 2) Crear paciente (numero_ficha lo asigna un trigger).
  const { data: paciente, error: pacienteError } = await supabase
    .from("pacientes")
    .insert({
      nombre,
      rut: str(formData, "rut") || null,
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
    // Limpieza: evitar dueño huérfano solo si lo creamos en este flujo.
    if (!usarExistente) {
      await supabase.from("duenos").delete().eq("id", duenoId);
    }
    return {
      error:
        tipoConflictoUnico(pacienteError) === "rut"
          ? "El RUT ya está registrado en otro paciente."
          : "No se pudo crear el paciente. Intenta nuevamente.",
    };
  }

  // 3) Vincular como dueño principal.
  const { error: linkError } = await supabase.from("paciente_duenos").insert({
    paciente_id: paciente.id,
    dueno_id: duenoId,
    es_principal: true,
  });

  if (linkError) {
    return { error: "Paciente creado, pero falló el vínculo con el dueño." };
  }

  revalidatePath("/pacientes");
  redirect(`/pacientes/${paciente.id}`);
}
