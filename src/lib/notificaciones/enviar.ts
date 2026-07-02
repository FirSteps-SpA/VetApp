import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { enviarEmail } from "./email";
import { enviarPush } from "./push";

export interface NotificarInput {
  usuarioId: string;
  tipo: string;
  titulo: string;
  cuerpo?: string;
  url?: string;
  referenciaTipo?: string;
  referenciaId?: string;
  // Contacto y preferencias (si se omiten, se envía por ambos canales).
  email?: string | null;
  canalEmail?: boolean;
  canalPush?: boolean;
}

// Crea la notificación in-app (idempotente por referencia) y despacha email/push.
export async function crearYNotificar(input: NotificarInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("notificaciones").insert({
    usuario_id: input.usuarioId,
    tipo: input.tipo,
    titulo: input.titulo,
    cuerpo: input.cuerpo ?? null,
    url: input.url ?? null,
    referencia_tipo: input.referenciaTipo ?? null,
    referencia_id: input.referenciaId ?? null,
  });

  // 23505 = ya existía una notificación para (usuario, tipo, referencia): no reenviar.
  if (error) {
    if (error.code === "23505") return;
    console.error("crearYNotificar:", error.message);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const href = input.url?.startsWith("http")
    ? input.url
    : `${base}${input.url ?? ""}`;
  const linkHtml = input.url
    ? `<p><a href="${href}">Ver detalle</a></p>`
    : "";

  if (input.canalEmail !== false && input.email) {
    await enviarEmail(
      input.email,
      input.titulo,
      `<p>${input.cuerpo ?? ""}</p>${linkHtml}`,
    );
  }
  if (input.canalPush !== false) {
    await enviarPush(input.usuarioId, {
      title: input.titulo,
      body: input.cuerpo,
      url: input.url,
    });
  }
}

export interface NotificarDuenoInput {
  tipo: string;
  titulo: string;
  cuerpo?: string;
  url?: string;
  referenciaTipo?: string;
  referenciaId?: string;
  // Preferencia que aplica: si el dueño la desactivó, no se notifica.
  preferencia?: "citas" | "vacunas";
}

// Notifica al dueño (si tiene portal activo), respetando sus preferencias.
export async function notificarDueno(
  duenoId: string,
  notif: NotificarDuenoInput,
): Promise<void> {
  const admin = createAdminClient();
  const { data: dueno } = await admin
    .from("duenos")
    .select("usuario_id, email")
    .eq("id", duenoId)
    .maybeSingle();
  if (!dueno?.usuario_id) return; // sin portal, no hay destinatario in-app/push

  const { data: cfg } = await admin
    .from("notificaciones_config")
    .select("*")
    .eq("dueno_id", duenoId)
    .maybeSingle();

  if (notif.preferencia === "citas" && cfg && !cfg.recordatorio_citas) return;
  if (notif.preferencia === "vacunas" && cfg && !cfg.recordatorio_vacunas) return;

  await crearYNotificar({
    usuarioId: dueno.usuario_id as string,
    tipo: notif.tipo,
    titulo: notif.titulo,
    cuerpo: notif.cuerpo,
    url: notif.url,
    referenciaTipo: notif.referenciaTipo,
    referenciaId: notif.referenciaId,
    email: (dueno.email as string | null) ?? null,
    canalEmail: cfg ? cfg.canal_email : true,
    canalPush: cfg ? cfg.canal_push : true,
  });
}
