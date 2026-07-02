import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ClinicaConfig } from "@/lib/types/db";

// Resuelve el logo a una URL usable: si ya es absoluta la deja; si es un path
// del bucket público clinica-assets, construye la URL pública.
function resolverLogo(logo: string | null): string | null {
  if (!logo) return null;
  if (/^https?:\/\//.test(logo)) return logo;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/clinica-assets/${logo}`;
}

export async function getClinicaConfig(): Promise<ClinicaConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinica_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getClinicaConfig:", error.message);
    return null;
  }

  return {
    ...(data as ClinicaConfig),
    logo_url: resolverLogo((data as ClinicaConfig).logo_url),
  };
}
