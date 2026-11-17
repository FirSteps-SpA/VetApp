import "server-only";

import { tenantDeUsuario } from "@/lib/storage-rutas";
import { createClient } from "@/lib/supabase/server";

// Clínica de la sesión (spec 6), tal como viaja en el JWT. Null para clientes.
export async function getTenantId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return tenantDeUsuario(user);
}
