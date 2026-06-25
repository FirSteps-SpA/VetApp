import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  DuenoDePaciente,
  Medicamento,
  Paciente,
} from "@/lib/types/db";

// Búsqueda por nombre, número de ficha o teléfono del dueño (vía RPC).
export async function buscarPacientes(q?: string): Promise<Paciente[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("buscar_pacientes", {
    q: q ?? null,
  });
  if (error) {
    console.error("buscarPacientes:", error.message);
    return [];
  }
  return (data as Paciente[]) ?? [];
}

export async function getPaciente(id: string): Promise<Paciente | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getPaciente:", error.message);
    return null;
  }
  return data as Paciente | null;
}

// Dueños del paciente, con el principal primero.
export async function getDuenosDePaciente(
  pacienteId: string,
): Promise<DuenoDePaciente[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("paciente_duenos")
    .select("es_principal, duenos(*)")
    .eq("paciente_id", pacienteId)
    .order("es_principal", { ascending: false });

  if (error) {
    console.error("getDuenosDePaciente:", error.message);
    return [];
  }

  type Row = { es_principal: boolean; duenos: DuenoDePaciente };
  return ((data as unknown as Row[]) ?? [])
    .filter((r) => r.duenos)
    .map((r) => ({ ...r.duenos, es_principal: r.es_principal }));
}

// Resumen clínico para la hero card. En Fase 2 las tablas clínicas suelen estar
// vacías; se devuelven estados nulos que la UI muestra como "sin registros".
export interface ResumenClinico {
  ultimaConsulta: { fecha: string; diagnostico: string } | null;
  proximaCita: { fecha_hora: string; motivo: string } | null;
  medicamentosActivos: Medicamento[];
  vacunasVencidas: number;
  vacunasProximas: number;
}

export async function getResumenClinico(
  pacienteId: string,
): Promise<ResumenClinico> {
  const supabase = createClient();

  const [consultaRes, citaRes, recetaRes, vencidasRes, proximasRes] =
    await Promise.all([
    supabase
      .from("consultas")
      .select("fecha, diagnostico")
      .eq("paciente_id", pacienteId)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("citas")
      .select("fecha_hora, motivo")
      .eq("paciente_id", pacienteId)
      .in("estado", ["pendiente", "confirmada"])
      .gte("fecha_hora", new Date().toISOString())
      .order("fecha_hora", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("recetas")
      .select("medicamentos")
      .eq("paciente_id", pacienteId)
      .eq("vigente", true)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vacunas")
      .select("id", { count: "exact", head: true })
      .eq("paciente_id", pacienteId)
      .eq("estado_alerta", "vencida"),
    supabase
      .from("vacunas")
      .select("id", { count: "exact", head: true })
      .eq("paciente_id", pacienteId)
      .eq("estado_alerta", "proxima"),
  ]);

  return {
    ultimaConsulta: consultaRes.data
      ? {
          fecha: consultaRes.data.fecha as string,
          diagnostico: consultaRes.data.diagnostico as string,
        }
      : null,
    proximaCita: citaRes.data
      ? {
          fecha_hora: citaRes.data.fecha_hora as string,
          motivo: citaRes.data.motivo as string,
        }
      : null,
    medicamentosActivos:
      (recetaRes.data?.medicamentos as Medicamento[] | undefined) ?? [],
    vacunasVencidas: vencidasRes.count ?? 0,
    vacunasProximas: proximasRes.count ?? 0,
  };
}

// URL firmada (1h) para la foto de perfil almacenada en Storage.
export async function getFotoSignedUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("fotos-pacientes")
    .createSignedUrl(path, 3600);
  if (error) {
    console.error("getFotoSignedUrl:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
