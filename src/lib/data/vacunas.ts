import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  EsquemaVacunacion,
  EstadoAlertaVacuna,
  Especie,
  Vacuna,
} from "@/lib/types/db";

export async function getVacunas(pacienteId: string): Promise<Vacuna[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vacunas")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("fecha_aplicacion", { ascending: false });

  if (error) {
    console.error("getVacunas:", error.message);
    return [];
  }
  return (data as unknown as Vacuna[]) ?? [];
}

export async function getEsquemasVacunacion(
  especie?: string,
): Promise<EsquemaVacunacion[]> {
  const supabase = createClient();
  let query = supabase
    .from("esquemas_vacunacion")
    .select("*")
    .eq("activo", true)
    .order("nombre_vacuna");
  if (especie) query = query.eq("especie", especie);

  const { data, error } = await query;
  if (error) {
    console.error("getEsquemasVacunacion:", error.message);
    return [];
  }
  return (data as EsquemaVacunacion[]) ?? [];
}

export interface AlertaVacuna {
  id: string;
  paciente_id: string;
  nombre_vacuna: string;
  proxima_dosis: string | null;
  estado_alerta: EstadoAlertaVacuna;
  paciente: { nombre: string; especie: Especie; numero_ficha: string } | null;
  dueno: { nombre: string; telefono: string } | null;
}

// Vacunas vencidas o próximas (todos los pacientes), con dueño principal.
export async function getAlertasVacunas(): Promise<AlertaVacuna[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vacunas")
    .select(
      "id, paciente_id, nombre_vacuna, proxima_dosis, estado_alerta, " +
        "pacientes(nombre, especie, numero_ficha, paciente_duenos(es_principal, duenos(nombre, telefono)))",
    )
    .in("estado_alerta", ["vencida", "proxima"])
    .order("proxima_dosis", { ascending: true });

  if (error) {
    console.error("getAlertasVacunas:", error.message);
    return [];
  }

  type Row = {
    id: string;
    paciente_id: string;
    nombre_vacuna: string;
    proxima_dosis: string | null;
    estado_alerta: EstadoAlertaVacuna;
    pacientes: {
      nombre: string;
      especie: Especie;
      numero_ficha: string;
      paciente_duenos: {
        es_principal: boolean;
        duenos: { nombre: string; telefono: string } | null;
      }[];
    } | null;
  };

  return ((data as unknown as Row[]) ?? []).map((r) => {
    const principal =
      r.pacientes?.paciente_duenos.find((pd) => pd.es_principal) ??
      r.pacientes?.paciente_duenos[0];
    return {
      id: r.id,
      paciente_id: r.paciente_id,
      nombre_vacuna: r.nombre_vacuna,
      proxima_dosis: r.proxima_dosis,
      estado_alerta: r.estado_alerta,
      paciente: r.pacientes
        ? {
            nombre: r.pacientes.nombre,
            especie: r.pacientes.especie,
            numero_ficha: r.pacientes.numero_ficha,
          }
        : null,
      dueno: principal?.duenos ?? null,
    };
  });
}
