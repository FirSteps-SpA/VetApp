import "server-only";

import { createClient } from "@/lib/supabase/server";
import { tenantDeUsuario } from "@/lib/storage-rutas";
import type { ClinicaConfig } from "@/lib/types/db";

// Configuración y marca de una clínica (spec 6): vive en `tenants`. El staff
// lee la de su clínica (la del JWT); un dueño, las de las clínicas donde tiene
// ficha; la entrada `/c/<slug>` usa `branding_por_slug`, sin sesión.

const COLUMNAS =
  "id, slug, nombre, direccion, ciudad, telefono, email, numero_registro, logo_url, activo, horas_cancelacion";

interface TenantRow {
  id: string;
  slug: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  numero_registro: string | null;
  logo_url: string | null;
  activo: boolean;
  horas_cancelacion: number;
}

function aConfig(t: TenantRow): ClinicaConfig {
  return {
    id: t.id,
    slug: t.slug,
    nombre_clinica: t.nombre,
    direccion: t.direccion,
    ciudad: t.ciudad,
    telefono: t.telefono,
    email: t.email,
    numero_registro: t.numero_registro,
    logo_url: t.logo_url,
    activo: t.activo,
    horas_cancelacion: t.horas_cancelacion,
  };
}

// Resuelve el logo a una URL usable: si ya es absoluta la deja; si es un path
// del bucket público clinica-assets, construye la URL pública.
export function logoPublicUrl(logo: string | null): string | null {
  if (!logo) return null;
  if (/^https?:\/\//.test(logo)) return logo;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/clinica-assets/${logo}`;
}

const conLogo = (c: ClinicaConfig): ClinicaConfig => ({
  ...c,
  logo_url: logoPublicUrl(c.logo_url),
});

// Config con el logo ya resuelto a URL (para PDFs / chrome del staff).
export async function getClinicaConfig(): Promise<ClinicaConfig | null> {
  const data = await getClinicaConfigRaw();
  return data ? conLogo(data) : null;
}

// Config de la clínica de la sesión tal cual está en la BD (logo_url como
// path) para editarla. Null si la sesión no tiene clínica o está desactivada.
export async function getClinicaConfigRaw(): Promise<ClinicaConfig | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = tenantDeUsuario(user);
  if (!tenantId) return null;
  const { data, error } = await supabase
    .from("tenants")
    .select(COLUMNAS)
    .eq("id", tenantId)
    .eq("activo", true)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("getClinicaConfigRaw:", error.message);
    return null;
  }
  return aConfig(data as TenantRow);
}

// Clínicas de un dueño (portal), con el logo resuelto, por nombre.
export async function getClinicasDelCliente(): Promise<ClinicaConfig[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(COLUMNAS)
    .eq("activo", true)
    .order("nombre");
  if (error) {
    console.error("getClinicasDelCliente:", error.message);
    return [];
  }
  return (data as TenantRow[]).map((t) => conLogo(aConfig(t)));
}

// Todas las clínicas (solo la cuenta de plataforma las ve todas por RLS).
export async function getClinicas(): Promise<ClinicaConfig[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tenants").select(COLUMNAS).order("nombre");
  if (error) {
    console.error("getClinicas:", error.message);
    return [];
  }
  return (data as TenantRow[]).map(aConfig);
}

// Nombre y logo de una clínica activa por su slug, para la entrada
// `/c/<slug>` (sin sesión). Null si no existe o está desactivada.
export async function getBrandingPorSlug(slug: string): Promise<{
  slug: string;
  nombre_clinica: string;
  logo_url: string | null;
} | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("branding_por_slug", { p_slug: slug });
  const fila = (data as { slug: string; nombre: string; logo_url: string | null }[] | null)?.[0];
  if (error || !fila) {
    if (error) console.error("getBrandingPorSlug:", error.message);
    return null;
  }
  return { slug: fila.slug, nombre_clinica: fila.nombre, logo_url: logoPublicUrl(fila.logo_url) };
}
