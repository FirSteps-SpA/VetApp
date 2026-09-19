import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
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

// Nombre y logo de la clínica para superficies SIN sesión (pantalla de
// login): `clinica_config` solo permite SELECT a `authenticated` por RLS, así
// que se usa el cliente service-role, con una proyección acotada a estos dos
// campos únicamente (nunca se expone el resto de la fila: teléfono, email,
// dirección, número de registro).
export async function getClinicaBrandingPublica(): Promise<{
  nombre_clinica: string;
  logo_url: string | null;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clinica_config")
    .select("nombre_clinica, logo_url")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("getClinicaBrandingPublica:", error.message);
    return null;
  }
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
