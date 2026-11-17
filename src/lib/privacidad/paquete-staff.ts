import "server-only";

import { getClinicaConfigRaw } from "@/lib/data/clinica";
import { createClient } from "@/lib/supabase/server";

import { armarPaqueteDatos, type PaqueteDatos } from "./paquete";
import { leerAceptaciones } from "./paquete-comun";

type Fila = Record<string, unknown>;

// Paquete de un dueño de la clínica, para entregarlo a pedido. Lee con la
// sesión del staff (RLS de su clínica) las mismas columnas que expone el
// portal, así que el resultado es el mismo que descargaría el dueño.
export async function armarPaqueteDesdeStaff(duenoId: string): Promise<PaqueteDatos | null> {
  const supabase = createClient();
  const [clinica, duenoRes, vinculosRes, prefsRes] = await Promise.all([
    getClinicaConfigRaw(),
    supabase
      .from("duenos")
      .select("id, nombre, rut, telefono, email, direccion, comuna, sector")
      .eq("id", duenoId)
      .maybeSingle(),
    supabase.from("paciente_duenos").select("paciente_id").eq("dueno_id", duenoId),
    supabase.from("notificaciones_config").select("*").eq("dueno_id", duenoId).maybeSingle(),
  ]);
  if (!clinica || !duenoRes.data) return null;

  const ids = ((vinculosRes.data as { paciente_id: string }[]) ?? []).map((v) => v.paciente_id);
  const [pacientes, consultas, vacunas, recetas, examenes, citas] = ids.length
    ? await Promise.all([
        supabase
          .from("pacientes")
          .select("id, nombre, especie, raza, fecha_nacimiento, sexo, peso_kg, numero_ficha")
          .in("id", ids)
          .order("nombre"),
        supabase.from("consultas").select("paciente_id, fecha, tipo, diagnostico, tratamiento").in("paciente_id", ids).order("fecha", { ascending: false }),
        supabase.from("vacunas").select("paciente_id, nombre_vacuna, fecha_aplicacion, proxima_dosis").in("paciente_id", ids).order("fecha_aplicacion", { ascending: false }),
        supabase.from("recetas").select("paciente_id, numero_receta, fecha, medicamentos, instrucciones_generales, vigente").in("paciente_id", ids).eq("vigente", true).order("fecha", { ascending: false }),
        supabase.from("examenes").select("paciente_id, nombre, tipo, fecha, descripcion, interno").in("paciente_id", ids).eq("interno", false).order("fecha", { ascending: false }),
        supabase.from("citas").select("paciente_id, fecha_hora, motivo, estado").in("paciente_id", ids).order("fecha_hora", { ascending: false }),
      ])
    : [];
  const de = (res: { data: unknown } | undefined, id: string) =>
    (((res?.data as Fila[]) ?? []).filter((f) => f.paciente_id === id));
  const listaPacientes = ((pacientes?.data as Fila[]) ?? []);
  const nombre = new Map(listaPacientes.map((p) => [p.id as string, p.nombre as string]));

  return armarPaqueteDatos({
    clinica,
    dueno: duenoRes.data as Fila,
    mascotas: listaPacientes.map((p) => ({
      mascota: p,
      consultas: de(consultas, p.id as string),
      vacunas: de(vacunas, p.id as string),
      recetas: de(recetas, p.id as string),
      examenes: de(examenes, p.id as string),
    })),
    citas: ((citas?.data as Fila[]) ?? []).map((c) => ({ ...c, paciente_nombre: nombre.get(c.paciente_id as string) ?? null })),
    preferencias: (prefsRes.data as Fila | null) ?? null,
    aceptaciones: await leerAceptaciones(supabase, duenoId),
  });
}
