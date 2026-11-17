import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// Aceptaciones del aviso de una ficha de dueño, con la versión aceptada.
export async function leerAceptaciones(
  supabase: SupabaseClient,
  duenoId: string,
): Promise<{ version: number; aceptado_en: string }[]> {
  const { data: acept } = await supabase
    .from("aceptaciones_privacidad")
    .select("aviso_id, aceptado_en")
    .eq("dueno_id", duenoId)
    .order("aceptado_en");
  const filas = (acept as { aviso_id: string; aceptado_en: string }[] | null) ?? [];
  if (filas.length === 0) return [];
  const { data: avisos } = await supabase
    .from("avisos_privacidad")
    .select("id, version")
    .in("id", filas.map((f) => f.aviso_id));
  const version = new Map(((avisos as { id: string; version: number }[]) ?? []).map((a) => [a.id, a.version]));
  return filas.map((f) => ({ version: version.get(f.aviso_id) ?? 0, aceptado_en: f.aceptado_en }));
}
