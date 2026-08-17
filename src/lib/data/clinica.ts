import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ClinicaConfig } from "@/lib/types/db";

// Resuelve el logo a una URL usable: si ya es absoluta la deja; si es un path
// del bucket público clinica-assets, construye la URL pública.
export function logoPublicUrl(logo: string | null): string | null {
  if (!logo) return null;
  if (/^https?:\/\//.test(logo)) return logo;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/clinica-assets/${logo}`;
}

// Config con el logo ya resuelto a URL (para PDFs / portal).
export async function getClinicaConfig(): Promise<ClinicaConfig | null> {
  const data = await getClinicaConfigRaw();
  if (!data) return null;
  return { ...data, logo_url: logoPublicUrl(data.logo_url) };
}

// Config tal cual está en la BD (logo_url como path/valor guardado) para editarla.
export async function getClinicaConfigRaw(): Promise<ClinicaConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinica_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("getClinicaConfigRaw:", error.message);
    return null;
  }
  return data as ClinicaConfig;
}
