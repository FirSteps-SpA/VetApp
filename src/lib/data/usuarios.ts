import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/types/db";

const CAMPOS =
  "id, nombre, email, rol, activo, sucursal_id, rut, titulo_profesional, created_at, updated_at";

// Registro de `usuarios` del staff autenticado (su propia fila). RLS lo permite
// vía `usuarios_select` (id = auth.uid()).
export async function getMiPerfil(): Promise<Usuario | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select(CAMPOS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getMiPerfil:", error.message);
    return null;
  }
  return data as Usuario | null;
}

// Veterinarios elegibles como responsables de consultas, recetas y vacunas, y
// como veterinario a cargo en documentos: rol 'veterinario' y activos (nunca
// 'dev'). Misma regla que `es_veterinario_elegible` en la BD. Solo devuelve los
// usuarios que el rol actual puede ver por RLS (dev/veterinario ven a todos;
// recepcionista solo su propia fila, así que para ella la lista viene vacía).
export type VeterinarioRef = Pick<
  Usuario,
  "id" | "nombre" | "rut" | "titulo_profesional"
>;

export async function getVeterinarios(): Promise<VeterinarioRef[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, rut, titulo_profesional")
    .eq("rol", "veterinario")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    console.error("getVeterinarios:", error.message);
    return [];
  }
  return (data as VeterinarioRef[]) ?? [];
}

// Validación en server actions antes de escribir (la BD lo garantiza con el
// trigger validar_veterinario_responsable, que responde con el código 23514).
export const VETERINARIO_INVALIDO = "El veterinario seleccionado no es válido.";

export async function esVeterinarioElegible(id: string | undefined): Promise<boolean> {
  if (!id) return false;
  const supabase = createClient();
  const { data } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", id)
    .eq("rol", "veterinario")
    .eq("activo", true)
    .maybeSingle();
  return !!data;
}
