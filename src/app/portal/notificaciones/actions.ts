"use server";

import { revalidatePath } from "next/cache";

import { getMiDueno } from "@/lib/data/portal";
import { createClient } from "@/lib/supabase/server";

export async function marcarTodasLeidas(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("usuario_id", user.id)
    .eq("leida", false);
  revalidatePath("/portal/notificaciones");
  revalidatePath("/portal");
}

export interface Preferencias {
  recordatorio_citas: boolean;
  recordatorio_vacunas: boolean;
  canal_email: boolean;
  canal_push: boolean;
}

export async function guardarPreferencias(
  prefs: Preferencias,
): Promise<{ error: string | null }> {
  const dueno = await getMiDueno();
  if (!dueno) return { error: "No se encontró tu registro." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notificaciones_config")
    .upsert({ dueno_id: dueno.id, ...prefs }, { onConflict: "dueno_id" });

  if (error) return { error: "No se pudieron guardar las preferencias." };
  revalidatePath("/portal/notificaciones");
  return { error: null };
}

export interface SuscripcionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function guardarSuscripcion(
  sub: SuscripcionInput,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const { error } = await supabase.from("push_subscriptions").insert({
    usuario_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
  });

  // 23505 = ya estaba suscrito ese endpoint: no es error.
  if (error && error.code !== "23505") {
    return { error: "No se pudo activar." };
  }
  return { error: null };
}

export async function quitarSuscripcion(
  endpoint: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("usuario_id", user.id)
    .eq("endpoint", endpoint);
  return { error: null };
}
