import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CitaConRel, Especie } from "@/lib/types/db";

const SELECT =
  "*, pacientes(nombre, especie, numero_ficha), duenos(nombre, telefono)";

type Row = Omit<CitaConRel, "paciente" | "dueno"> & {
  pacientes: { nombre: string; especie: Especie; numero_ficha: string } | null;
  duenos: { nombre: string; telefono: string } | null;
};

function mapRow(r: Row): CitaConRel {
  return { ...r, paciente: r.pacientes, dueno: r.duenos };
}

// Citas en un rango [desde, hasta) (ISO timestamptz).
export async function getCitasRango(
  desde: string,
  hasta: string,
): Promise<CitaConRel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("citas")
    .select(SELECT)
    .gte("fecha_hora", desde)
    .lt("fecha_hora", hasta)
    .order("fecha_hora", { ascending: true });

  if (error) {
    console.error("getCitasRango:", error.message);
    return [];
  }
  return ((data as unknown as Row[]) ?? []).map(mapRow);
}

// Solicitudes de cita hechas por clientes, pendientes de aprobación.
export async function getSolicitudesPendientes(): Promise<CitaConRel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("citas")
    .select(SELECT)
    .eq("creado_por_cliente", true)
    .eq("estado", "pendiente")
    .order("fecha_hora", { ascending: true });

  if (error) {
    console.error("getSolicitudesPendientes:", error.message);
    return [];
  }
  return ((data as unknown as Row[]) ?? []).map(mapRow);
}

export async function countSolicitudesPendientes(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("creado_por_cliente", true)
    .eq("estado", "pendiente");
  return count ?? 0;
}

export async function getCitasPaciente(
  pacienteId: string,
): Promise<CitaConRel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("citas")
    .select(SELECT)
    .eq("paciente_id", pacienteId)
    .order("fecha_hora", { ascending: false });

  if (error) {
    console.error("getCitasPaciente:", error.message);
    return [];
  }
  return ((data as unknown as Row[]) ?? []).map(mapRow);
}
