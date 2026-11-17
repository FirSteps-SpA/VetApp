import "server-only";

import { getClinicasDelCliente } from "@/lib/data/clinica";
import type { DuenoPortal } from "@/lib/data/portal";
import { createClient } from "@/lib/supabase/server";

import { armarPaqueteDatos, type PaqueteDatos } from "./paquete";
import { leerAceptaciones } from "./paquete-comun";

type Fila = Record<string, unknown>;

// Paquete del dueño de la sesión en una clínica, leído con las mismas
// funciones y políticas que usa el portal (solo lo que el portal le muestra).
export async function armarPaqueteDesdePortal(dueno: DuenoPortal): Promise<PaqueteDatos | null> {
  const supabase = createClient();
  const [clinicas, mascotasRes, citasRes, prefsRes] = await Promise.all([
    getClinicasDelCliente(),
    supabase.rpc("portal_mascotas"),
    supabase.rpc("portal_citas"),
    supabase.from("notificaciones_config").select("*").eq("dueno_id", dueno.id).maybeSingle(),
  ]);
  const clinica = clinicas.find((c) => c.id === dueno.tenant_id);
  if (!clinica || mascotasRes.error) return null;

  const mascotas = ((mascotasRes.data as Fila[]) ?? []).filter((m) => m.tenant_id === dueno.tenant_id);
  const detalle = await Promise.all(
    mascotas.map(async (m) => {
      const id = m.id as string;
      const [consultas, vacunas, recetas, examenes] = await Promise.all([
        supabase.rpc("portal_consultas", { p_paciente: id }),
        supabase.rpc("portal_vacunas", { p_paciente: id }),
        supabase
          .from("recetas")
          .select("numero_receta, fecha, medicamentos, instrucciones_generales, vigente")
          .eq("paciente_id", id)
          .eq("vigente", true)
          .order("fecha", { ascending: false }),
        supabase
          .from("examenes")
          .select("nombre, tipo, fecha, descripcion, interno")
          .eq("paciente_id", id)
          .eq("interno", false)
          .order("fecha", { ascending: false }),
      ]);
      return {
        mascota: m,
        consultas: (consultas.data as Fila[]) ?? [],
        vacunas: (vacunas.data as Fila[]) ?? [],
        recetas: (recetas.data as Fila[]) ?? [],
        examenes: (examenes.data as Fila[]) ?? [],
      };
    }),
  );

  return armarPaqueteDatos({
    clinica,
    dueno: dueno as unknown as Fila,
    mascotas: detalle,
    citas: ((citasRes.data as Fila[]) ?? []).filter((c) => c.tenant_id === dueno.tenant_id),
    preferencias: (prefsRes.data as Fila | null) ?? null,
    aceptaciones: await leerAceptaciones(supabase, dueno.id),
  });
}
