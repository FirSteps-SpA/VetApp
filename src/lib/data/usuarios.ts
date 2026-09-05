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

// Datos mínimos del veterinario a cargo para autollenar documentos. Solo devuelve
// los usuarios que el rol actual puede ver por RLS (dev/veterinario ven a todos;
// recepcionista solo su propia fila, que suele no ser veterinario).
export type VeterinarioRef = Pick<
  Usuario,
  "id" | "nombre" | "rut" | "titulo_profesional"
>;

export async function getVeterinarios(): Promise<VeterinarioRef[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, rut, titulo_profesional")
    .in("rol", ["dev", "veterinario"])
    .eq("activo", true)
    .order("nombre");

  if (error) {
    console.error("getVeterinarios:", error.message);
    return [];
  }
  return (data as VeterinarioRef[]) ?? [];
}
