import type { Medicamento } from "@/lib/types/db";

// Paquete de datos de un dueño en una clínica (spec 7: derechos de acceso y
// portabilidad). Lo arma esta función pura desde datos ya leídos, para que el
// portal y el staff entreguen exactamente lo mismo. Toma solo los campos que
// el portal muestra: aunque la entrada traiga notas internas, anamnesis o
// exámenes internos, no salen del paquete.

export const FORMATO_PAQUETE = "vetapp-datos-dueno/1";

type Fila = Record<string, unknown>;

export interface EntradaPaquete {
  clinica: { nombre_clinica: string; direccion: string | null; telefono: string | null; email: string | null };
  dueno: Fila;
  mascotas: {
    mascota: Fila;
    consultas: Fila[];
    vacunas: Fila[];
    recetas: Fila[];
    examenes: Fila[];
  }[];
  citas: Fila[];
  preferencias: Fila | null;
  aceptaciones: { version: number; aceptado_en: string }[];
}

export interface PaqueteDatos {
  formato: typeof FORMATO_PAQUETE;
  generado_en: string;
  clinica: { nombre: string; direccion: string | null; telefono: string | null; email: string | null };
  dueno: {
    nombre: string;
    rut: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    comuna: string | null;
    sector: string | null;
  };
  mascotas: {
    nombre: string;
    especie: string;
    raza: string | null;
    sexo: string | null;
    fecha_nacimiento: string | null;
    peso_kg: number | null;
    numero_ficha: string;
    consultas: { fecha: string; tipo: string; diagnostico: string; tratamiento: string }[];
    vacunas: { nombre_vacuna: string; fecha_aplicacion: string; proxima_dosis: string | null }[];
    recetas: {
      numero_receta: string;
      fecha: string;
      medicamentos: Medicamento[];
      instrucciones_generales: string | null;
    }[];
    examenes: { nombre: string; tipo: string; fecha: string; descripcion: string | null }[];
  }[];
  citas: { fecha_hora: string; motivo: string; estado: string; mascota: string | null }[];
  preferencias: {
    recordatorio_citas: boolean;
    recordatorio_vacunas: boolean;
    canal_email: boolean;
    canal_push: boolean;
  } | null;
  aceptaciones_aviso: { version: number; aceptado_en: string }[];
}

const s = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const n = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
const num = (v: unknown): number | null => (v == null || v === "" ? null : Number(v));

export function armarPaqueteDatos(e: EntradaPaquete, ahora: Date = new Date()): PaqueteDatos {
  return {
    formato: FORMATO_PAQUETE,
    generado_en: ahora.toISOString(),
    clinica: {
      nombre: e.clinica.nombre_clinica,
      direccion: e.clinica.direccion,
      telefono: e.clinica.telefono,
      email: e.clinica.email,
    },
    dueno: {
      nombre: s(e.dueno.nombre),
      rut: n(e.dueno.rut),
      telefono: n(e.dueno.telefono),
      email: n(e.dueno.email),
      direccion: n(e.dueno.direccion),
      comuna: n(e.dueno.comuna),
      sector: n(e.dueno.sector),
    },
    mascotas: e.mascotas.map(({ mascota, consultas, vacunas, recetas, examenes }) => ({
      nombre: s(mascota.nombre),
      especie: s(mascota.especie),
      raza: n(mascota.raza),
      sexo: n(mascota.sexo),
      fecha_nacimiento: n(mascota.fecha_nacimiento),
      peso_kg: num(mascota.peso_kg),
      numero_ficha: s(mascota.numero_ficha),
      consultas: consultas.map((c) => ({
        fecha: s(c.fecha),
        tipo: s(c.tipo),
        diagnostico: s(c.diagnostico),
        tratamiento: s(c.tratamiento),
      })),
      vacunas: vacunas.map((v) => ({
        nombre_vacuna: s(v.nombre_vacuna),
        fecha_aplicacion: s(v.fecha_aplicacion),
        proxima_dosis: n(v.proxima_dosis),
      })),
      recetas: recetas
        .filter((r) => r.vigente !== false)
        .map((r) => ({
          numero_receta: s(r.numero_receta),
          fecha: s(r.fecha),
          medicamentos: (Array.isArray(r.medicamentos) ? r.medicamentos : []) as Medicamento[],
          instrucciones_generales: n(r.instrucciones_generales),
        })),
      examenes: examenes
        .filter((x) => x.interno !== true)
        .map((x) => ({
          nombre: s(x.nombre),
          tipo: s(x.tipo),
          fecha: s(x.fecha),
          descripcion: n(x.descripcion),
        })),
    })),
    citas: e.citas.map((c) => ({
      fecha_hora: s(c.fecha_hora),
      motivo: s(c.motivo),
      estado: s(c.estado),
      mascota: n(c.paciente_nombre),
    })),
    preferencias: e.preferencias
      ? {
          recordatorio_citas: e.preferencias.recordatorio_citas !== false,
          recordatorio_vacunas: e.preferencias.recordatorio_vacunas !== false,
          canal_email: e.preferencias.canal_email !== false,
          canal_push: e.preferencias.canal_push !== false,
        }
      : null,
    aceptaciones_aviso: e.aceptaciones.map((a) => ({ version: a.version, aceptado_en: a.aceptado_en })),
  };
}
