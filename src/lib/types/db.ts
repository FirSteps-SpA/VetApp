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
