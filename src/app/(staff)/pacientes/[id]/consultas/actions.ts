"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  TIPOS_CONSULTA,
  type Medicamento,
  type TipoConsulta,
  type TipoExamen,
} from "@/lib/types/db";

export interface RecetaInput {
  instrucciones_generales?: string;
  medicamentos: Medicamento[];
}

// Examen ya subido a Storage, pendiente de vincular a la consulta al guardarla.
export interface ExamenPendiente {
  tipo: TipoExamen;
  nombre: string;
  fecha: string;
  descripcion?: string;
  archivo_url: string;
  archivo_nombre: string;
  archivo_tipo: string;
  archivo_tamanio_bytes: number;
}

export interface CrearConsultaInput {
  pacienteId: string;
  tipo: TipoConsulta;
  motivo: string;
  anamnesis?: string;
  examen_fisico?: string;
  diagnostico: string;
  diagnostico_diferencial?: string;
  tratamiento: string;
  peso_kg?: string;
  temperatura_c?: string;
  notas?: string;
  receta?: RecetaInput | null;
  examenes?: ExamenPendiente[];
  citaId?: string | null;
}

export type CrearConsultaResult =
  | { ok: true; consultaId: string }
  | { ok: false; error: string };

function num(value?: string): number | null {
  if (!value || !value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function crearConsulta(
  input: CrearConsultaInput,
): Promise<CrearConsultaResult> {
  // Validación.
  if (!TIPOS_CONSULTA.some((t) => t.value === input.tipo)) {
    return { ok: false, error: "Tipo de consulta inválido." };
  }
  if (!input.motivo?.trim()) return { ok: false, error: "El motivo es obligatorio." };
  if (!input.diagnostico?.trim())
    return { ok: false, error: "El diagnóstico es obligatorio." };
  if (!input.tratamiento?.trim())
    return { ok: false, error: "El tratamiento es obligatorio." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  // 1) Crear consulta (veterinario = usuario actual).
  const { data: consulta, error: consultaError } = await supabase
    .from("consultas")
    .insert({
      paciente_id: input.pacienteId,
      veterinario_id: user.id,
      tipo: input.tipo,
      motivo: input.motivo.trim(),
      anamnesis: input.anamnesis?.trim() || null,
      examen_fisico: input.examen_fisico?.trim() || null,
      diagnostico: input.diagnostico.trim(),
      diagnostico_diferencial: input.diagnostico_diferencial?.trim() || null,
      tratamiento: input.tratamiento.trim(),
      peso_kg: num(input.peso_kg),
      temperatura_c: num(input.temperatura_c),
      notas: input.notas?.trim() || null,
    })
    .select("id")
    .single();

  if (consultaError || !consulta) {
    return { ok: false, error: "No se pudo guardar la consulta." };
  }

  // 2) Receta opcional con medicamentos válidos (al menos un nombre).
  const medicamentos = (input.receta?.medicamentos ?? []).filter((m) =>
    m.nombre?.trim(),
  );

  if (medicamentos.length > 0) {
    const { error: recetaError } = await supabase.from("recetas").insert({
      consulta_id: consulta.id,
      paciente_id: input.pacienteId,
      veterinario_id: user.id,
      medicamentos,
      instrucciones_generales:
        input.receta?.instrucciones_generales?.trim() || null,
    });

    if (recetaError) {
      return {
        ok: false,
        error: "Consulta guardada, pero falló la receta. Revísala en la ficha.",
      };
    }
  }

  // 3) Exámenes adjuntos (ya subidos a Storage), vinculados a esta consulta.
  const examenes = (input.examenes ?? []).filter((e) => e.archivo_url);
  if (examenes.length > 0) {
    const { error: examenesError } = await supabase.from("examenes").insert(
      examenes.map((e) => ({
        paciente_id: input.pacienteId,
        consulta_id: consulta.id,
        tipo: e.tipo,
        nombre: e.nombre,
        descripcion: e.descripcion?.trim() || null,
        fecha: e.fecha,
        archivo_url: e.archivo_url,
        archivo_nombre: e.archivo_nombre,
        archivo_tipo: e.archivo_tipo,
        archivo_tamanio_bytes: e.archivo_tamanio_bytes,
      })),
    );

    if (examenesError) {
      return {
        ok: false,
        error:
          "Consulta guardada, pero falló adjuntar exámenes. Revísalos en la ficha.",
      };
    }
  }

  // 4) Vincular con la cita de origen (si la consulta se inició desde la agenda).
  if (input.citaId) {
    await supabase
      .from("citas")
      .update({ estado: "realizada", consulta_id: consulta.id })
      .eq("id", input.citaId);
    revalidatePath("/agenda");
  }

  revalidatePath(`/pacientes/${input.pacienteId}`);
  return { ok: true, consultaId: consulta.id };
}

export interface ActualizarConsultaInput {
  tipo: TipoConsulta;
  motivo: string;
  anamnesis?: string;
  examen_fisico?: string;
  diagnostico: string;
  diagnostico_diferencial?: string;
  tratamiento: string;
  peso_kg?: string;
  temperatura_c?: string;
  notas?: string;
}

// Edita los datos de una consulta. No se eliminan consultas (quedan en audit_log);
// editar el peso aquí no reescribe pacientes.peso_kg (eso solo ocurre al crear).
export async function actualizarConsulta(
  consultaId: string,
  pacienteId: string,
  input: ActualizarConsultaInput,
): Promise<{ error: string | null }> {
  if (!TIPOS_CONSULTA.some((t) => t.value === input.tipo)) {
    return { error: "Tipo de consulta inválido." };
  }
  if (!input.motivo?.trim()) return { error: "El motivo es obligatorio." };
  if (!input.diagnostico?.trim())
    return { error: "El diagnóstico es obligatorio." };
  if (!input.tratamiento?.trim())
    return { error: "El tratamiento es obligatorio." };

  const supabase = createClient();
  const { error } = await supabase
    .from("consultas")
    .update({
      tipo: input.tipo,
      motivo: input.motivo.trim(),
      anamnesis: input.anamnesis?.trim() || null,
      examen_fisico: input.examen_fisico?.trim() || null,
      diagnostico: input.diagnostico.trim(),
      diagnostico_diferencial: input.diagnostico_diferencial?.trim() || null,
      tratamiento: input.tratamiento.trim(),
      peso_kg: num(input.peso_kg),
      temperatura_c: num(input.temperatura_c),
      notas: input.notas?.trim() || null,
    })
    .eq("id", consultaId);

  if (error) return { error: "No se pudo actualizar la consulta." };

  revalidatePath(`/pacientes/${pacienteId}`);
  revalidatePath(`/pacientes/${pacienteId}/consultas/${consultaId}`);
  return { error: null };
}

// Guarda en la receta la ruta del PDF generado y subido a Storage.
export async function setRecetaPdf(
  recetaId: string,
  pacienteId: string,
  path: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("recetas")
    .update({ pdf_url: path })
    .eq("id", recetaId);

  if (error) return { error: "No se pudo guardar el PDF." };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}

// Invalida una receta (no se elimina; queda como histórico anulado).
export async function anularReceta(
  recetaId: string,
  pacienteId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("recetas")
    .update({ vigente: false })
    .eq("id", recetaId);

  if (error) return { error: "No se pudo anular la receta." };

  revalidatePath(`/pacientes/${pacienteId}`);
  return { error: null };
}
