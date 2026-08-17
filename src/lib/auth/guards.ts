import "server-only";

import { createClient } from "@/lib/supabase/server";

import { getRol, type Rol } from "./roles";

// Verifica que el usuario autenticado tenga uno de los roles indicados.
export async function esRol(...roles: Rol[]): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rol = getRol(user);
  return rol !== null && roles.includes(rol);
}

export const esDev = () => esRol("dev");
