import "server-only";

import { createClient } from "@/lib/supabase/server";

// Avisos de privacidad y aceptaciones (spec 7). La RLS acota: el staff ve los
// avisos de su clínica; un dueño, los de sus clínicas y sus aceptaciones.

export interface AvisoPrivacidad {
  id: string;
  tenant_id: string;
  version: number;
  texto: string;
  publicado_en: string;
}

export interface AceptacionPrivacidad {
  tenant_id: string;
  dueno_id: string;
  aviso_id: string;
  aceptado_en: string;
}

// Versiones del aviso de la clínica de la sesión, de la más nueva a la más vieja.
export async function getAvisosClinica(): Promise<AvisoPrivacidad[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("avisos_privacidad")
    .select("id, tenant_id, version, texto, publicado_en")
    .order("version", { ascending: false });
  if (error) console.error("getAvisosClinica:", error.message);
  return (data as AvisoPrivacidad[] | null) ?? [];
}

export async function getAvisosPorId(ids: string[]): Promise<AvisoPrivacidad[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("avisos_privacidad")
    .select("id, tenant_id, version, texto, publicado_en")
    .in("id", ids);
  if (error) console.error("getAvisosPorId:", error.message);
  return (data as AvisoPrivacidad[] | null) ?? [];
}

// Aceptaciones registradas por la cuenta de la sesión (portal).
export async function getMisAceptaciones(): Promise<AceptacionPrivacidad[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("aceptaciones_privacidad")
    .select("tenant_id, dueno_id, aviso_id, aceptado_en")
    .order("aceptado_en", { ascending: false });
  if (error) console.error("getMisAceptaciones:", error.message);
  return (data as AceptacionPrivacidad[] | null) ?? [];
}

// ¿La clínica de la sesión tiene un aviso publicado? (requisito para invitar)
export async function clinicaTieneAviso(): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from("avisos_privacidad")
    .select("id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}
