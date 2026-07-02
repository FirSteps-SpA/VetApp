import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Dueno,
  Especie,
  EstadoAlertaVacuna,
  EstadoCita,
  Medicamento,
  TipoConsulta,
  TipoExamen,
} from "@/lib/types/db";

// --- Vistas seguras para el cliente (solo columnas permitidas) ---

export interface MascotaPortal {
  id: string;
  nombre: string;
  especie: Especie;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  peso_kg: number | null;
  numero_ficha: string;
  foto_url: string | null;
}

export interface ConsultaPortal {
  id: string;
  fecha: string;
  tipo: TipoConsulta;
  diagnostico: string;
  tratamiento: string;
}

export interface RecetaPortal {
  id: string;
  numero_receta: string;
  fecha: string;
  medicamentos: Medicamento[];
  instrucciones_generales: string | null;
}

export interface ExamenPortal {
  id: string;
  nombre: string;
  tipo: TipoExamen;
  fecha: string;
  descripcion: string | null;
  archivo_tipo: string | null;
}

export interface VacunaPortal {
  id: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis: string | null;
  estado_alerta: EstadoAlertaVacuna;
}

export interface CitaPortal {
  id: string;
  fecha_hora: string;
  motivo: string;
  estado: EstadoCita;
  paciente: { nombre: string } | null;
}

// Mascotas del cliente autenticado (RLS filtra a las suyas).
export async function getMisMascotas(): Promise<MascotaPortal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .select(
      "id, nombre, especie, raza, fecha_nacimiento, sexo, peso_kg, numero_ficha, foto_url",
    )
    .order("nombre");
  if (error) {
    console.error("getMisMascotas:", error.message);
    return [];
  }
  return (data as MascotaPortal[]) ?? [];
}

// Citas del cliente (de sus mascotas).
export async function getMisCitas(): Promise<CitaPortal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("citas")
    .select("id, fecha_hora, motivo, estado, pacientes(nombre)")
    .order("fecha_hora", { ascending: false });
  if (error) {
    console.error("getMisCitas:", error.message);
    return [];
  }
  type Row = Omit<CitaPortal, "paciente"> & {
    pacientes: { nombre: string } | null;
  };
  return ((data as unknown as Row[]) ?? []).map((r) => ({
    ...r,
    paciente: r.pacientes,
  }));
}

export interface FichaPortal {
  paciente: MascotaPortal;
  dueno: Dueno | null;
  fotoUrl: string | null;
  consultas: ConsultaPortal[];
  recetas: RecetaPortal[];
  examenes: (ExamenPortal & { url: string | null })[];
  vacunas: VacunaPortal[];
}

// Firma rutas privadas con el cliente admin. Es seguro porque las rutas
// provienen de lecturas ya filtradas por RLS (pertenecen al cliente y no son internas).
async function firmar(
  bucket: string,
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin.storage.from(bucket).createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  });
  return out;
}

// Ficha simplificada de una mascota. Devuelve null si no pertenece al cliente
// (RLS hace que la lectura del paciente retorne vacío).
export async function getMascotaPortal(id: string): Promise<FichaPortal | null> {
  const supabase = createClient();

  const { data: paciente } = await supabase
    .from("pacientes")
    .select(
      "id, nombre, especie, raza, fecha_nacimiento, sexo, peso_kg, numero_ficha, foto_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (!paciente) return null;
  const p = paciente as MascotaPortal;

  const [duenoRes, consultasRes, recetasRes, examenesRes, vacunasRes] =
    await Promise.all([
      supabase.from("duenos").select("*").not("usuario_id", "is", null).limit(1).maybeSingle(),
      supabase
        .from("consultas")
        .select("id, fecha, tipo, diagnostico, tratamiento")
        .eq("paciente_id", id)
        .order("fecha", { ascending: false }),
      supabase
        .from("recetas")
        .select("id, numero_receta, fecha, medicamentos, instrucciones_generales")
        .eq("paciente_id", id)
        .eq("vigente", true)
        .order("fecha", { ascending: false }),
      supabase
        .from("examenes")
        .select("id, nombre, tipo, fecha, descripcion, archivo_tipo, archivo_url")
        .eq("paciente_id", id)
        .eq("interno", false)
        .order("fecha", { ascending: false }),
      supabase
        .from("vacunas")
        .select("id, nombre_vacuna, fecha_aplicacion, proxima_dosis, estado_alerta")
        .eq("paciente_id", id)
        .order("fecha_aplicacion", { ascending: false }),
    ]);

  const examenesRaw =
    (examenesRes.data as unknown as (ExamenPortal & {
      archivo_url: string | null;
    })[]) ?? [];

  const urlsExamenes = await firmar(
    "examenes",
    examenesRaw.map((e) => e.archivo_url).filter((x): x is string => !!x),
  );

  const fotoUrls = p.foto_url ? await firmar("fotos-pacientes", [p.foto_url]) : {};

  return {
    paciente: p,
    dueno: (duenoRes.data as Dueno | null) ?? null,
    fotoUrl: p.foto_url ? (fotoUrls[p.foto_url] ?? null) : null,
    consultas: (consultasRes.data as ConsultaPortal[]) ?? [],
    recetas: (recetasRes.data as unknown as RecetaPortal[]) ?? [],
    examenes: examenesRaw.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      tipo: e.tipo,
      fecha: e.fecha,
      descripcion: e.descripcion,
      archivo_tipo: e.archivo_tipo,
      url: e.archivo_url ? (urlsExamenes[e.archivo_url] ?? null) : null,
    })),
    vacunas: (vacunasRes.data as VacunaPortal[]) ?? [],
  };
}
