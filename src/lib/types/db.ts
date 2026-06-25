// Tipos del dominio escritos a mano (subset de las tablas usadas en Fase 2).
// Cuando exista una base con datos, se pueden reemplazar por los tipos generados
// con `supabase gen types typescript`.

export type Especie =
  | "perro"
  | "gato"
  | "conejo"
  | "ave"
  | "reptil"
  | "otro";

export type Sexo = "macho" | "hembra" | "desconocido";

export type EstadoAlertaVacuna = "al_dia" | "proxima" | "vencida";

export interface Paciente {
  id: string;
  nombre: string;
  especie: Especie;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: Sexo | null;
  castrado: boolean | null;
  peso_kg: number | null;
  foto_url: string | null;
  numero_ficha: string;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dueno {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  usuario_id: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

// Dueño con la marca de principal (proveniente de paciente_duenos).
export interface DuenoDePaciente extends Dueno {
  es_principal: boolean;
}

export const ESPECIES: { value: Especie; label: string; icon: string }[] = [
  { value: "perro", label: "Perro", icon: "🐕" },
  { value: "gato", label: "Gato", icon: "🐈" },
  { value: "conejo", label: "Conejo", icon: "🐇" },
  { value: "ave", label: "Ave", icon: "🦜" },
  { value: "reptil", label: "Reptil", icon: "🦎" },
  { value: "otro", label: "Otro", icon: "🐾" },
];

export const SEXOS: { value: Sexo; label: string }[] = [
  { value: "macho", label: "Macho" },
  { value: "hembra", label: "Hembra" },
  { value: "desconocido", label: "Desconocido" },
];

export function iconoEspecie(especie: Especie): string {
  return ESPECIES.find((e) => e.value === especie)?.icon ?? "🐾";
}

export function labelEspecie(especie: Especie): string {
  return ESPECIES.find((e) => e.value === especie)?.label ?? especie;
}

// ---------------------------------------------------------------------------
// Consultas y recetas (Fase 3)
// ---------------------------------------------------------------------------

export type TipoConsulta =
  | "consulta"
  | "control"
  | "cirugia"
  | "urgencia"
  | "vacunacion";

export const TIPOS_CONSULTA: { value: TipoConsulta; label: string }[] = [
  { value: "consulta", label: "Consulta" },
  { value: "control", label: "Control" },
  { value: "cirugia", label: "Cirugía" },
  { value: "urgencia", label: "Urgencia" },
  { value: "vacunacion", label: "Vacunación" },
];

export function labelTipoConsulta(tipo: TipoConsulta): string {
  return TIPOS_CONSULTA.find((t) => t.value === tipo)?.label ?? tipo;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  veterinario_id: string;
  cita_id: string | null;
  fecha: string;
  tipo: TipoConsulta;
  motivo: string;
  anamnesis: string | null;
  examen_fisico: string | null;
  diagnostico: string;
  diagnostico_diferencial: string | null;
  tratamiento: string;
  peso_kg: number | null;
  temperatura_c: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

// Consulta con el nombre del veterinario embebido.
export interface ConsultaConVet extends Consulta {
  veterinario: { nombre: string } | null;
}

export interface Medicamento {
  nombre: string;
  presentacion?: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  instrucciones?: string;
}

export interface Receta {
  id: string;
  consulta_id: string;
  paciente_id: string;
  veterinario_id: string;
  numero_receta: string;
  fecha: string;
  medicamentos: Medicamento[];
  instrucciones_generales: string | null;
  vigente: boolean;
  pdf_url: string | null;
  created_at: string;
}

// Resumen legible de un medicamento para la hero card / listados.
export function resumenMedicamento(m: Medicamento): string {
  return [m.nombre, m.dosis, m.frecuencia].filter(Boolean).join(" · ");
}

// ---------------------------------------------------------------------------
// Exámenes / archivos adjuntos (Fase 4)
// ---------------------------------------------------------------------------

export type TipoExamen =
  | "hemograma"
  | "radiografia"
  | "ecografia"
  | "biopsia"
  | "cultivo"
  | "foto"
  | "otro";

export const TIPOS_EXAMEN: { value: TipoExamen; label: string }[] = [
  { value: "hemograma", label: "Hemograma" },
  { value: "radiografia", label: "Radiografía" },
  { value: "ecografia", label: "Ecografía" },
  { value: "biopsia", label: "Biopsia" },
  { value: "cultivo", label: "Cultivo" },
  { value: "foto", label: "Foto" },
  { value: "otro", label: "Otro" },
];

export function labelTipoExamen(tipo: TipoExamen): string {
  return TIPOS_EXAMEN.find((t) => t.value === tipo)?.label ?? tipo;
}

export interface Examen {
  id: string;
  paciente_id: string;
  consulta_id: string | null;
  tipo: TipoExamen;
  nombre: string;
  descripcion: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  archivo_tipo: string | null;
  archivo_tamanio_bytes: number | null;
  interno: boolean;
  fecha: string;
  created_at: string;
}

export function esImagen(mime: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

export function esPdf(mime: string | null): boolean {
  return mime === "application/pdf";
}
