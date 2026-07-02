import "server-only";

import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

let configurado = false;

function configurar(): boolean {
  if (configurado) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn("Web Push no configurado (claves VAPID ausentes).");
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    pub,
    priv,
  );
  configurado = true;
  return true;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
}

// Envía una push a todas las suscripciones del usuario. Limpia las caducadas.
export async function enviarPush(
  usuarioId: string,
  payload: PushPayload,
): Promise<void> {
  if (!configurar()) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("usuario_id", usuarioId);

  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint as string,
          keys: { p256dh: s.p256dh as string, auth: s.auth as string },
        },
        JSON.stringify(payload),
      );
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        console.error("Push error:", e);
      }
    }
  }
}
