import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Sucursal, UsuarioAdmin } from "@/lib/types/db";

export async function getSucursales(): Promise<Sucursal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .order("nombre");
  if (error) {
    console.error("getSucursales:", error.message);
    return [];
  }
  return (data as Sucursal[]) ?? [];
}

export async function getUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select(
      "id, nombre, email, rol, activo, sucursal_id, created_at, sucursal:sucursales(nombre)",
    )
    .order("rol")
    .order("nombre");
  if (error) {
    console.error("getUsuariosAdmin:", error.message);
    return [];
  }
  return (data as unknown as UsuarioAdmin[]) ?? [];
}
