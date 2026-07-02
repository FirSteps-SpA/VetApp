import "server-only";

import { createClient } from "@supabase/supabase-js";

// Cliente con service_role: BYPASSEA RLS. Usar SOLO en el servidor y para
// operaciones administrativas explícitas (invitar clientes, firmar URLs ya
// validadas por RLS). Nunca exponer la service_role key al cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
