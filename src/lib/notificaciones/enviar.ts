import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { enviarEmail } from "./email";
import { enviarPush } from "./push";

export interface NotificarInput {
  usuarioId: string;
  // Clínica de la que viene la notificación (spec 6): se guarda con ella y su
  // nombre encabeza el email y el push.
  tenantId: string;
  clinicaNombre: string;
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

function escaparHtml(t: string): string {
  return t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Crea la notificación in-app (idempotente por referencia) y despacha email/push.
export async function crearYNotificar(input: NotificarInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("notificaciones").insert({
    tenant_id: input.tenantId,
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
      `${input.clinicaNombre}: ${input.titulo}`,
      `<p>${input.cuerpo ?? ""}</p>${linkHtml}<p>${escaparHtml(input.clinicaNombre)}</p>`,
    );
  }
  if (input.canalPush !== false) {
    await enviarPush(input.usuarioId, {
      title: `${input.clinicaNombre} · ${input.titulo}`,
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
    .select("usuario_id, email, tenant_id")
    .eq("id", duenoId)
    .maybeSingle();
  if (!dueno?.usuario_id) return; // sin portal, no hay destinatario in-app/push
  // La notificación lleva la marca de la clínica de esta ficha; una clínica
  // desactivada no notifica. (Consulta aparte: embeber `tenants` sería ambiguo,
  // porque varias tablas enlazan dueños y clínicas.)
  const { data: clinica } = await admin
    .from("tenants")
    .select("nombre, activo")
    .eq("id", dueno.tenant_id)
    .maybeSingle();
  if (!clinica?.activo) return;

  const { data: cfg } = await admin
    .from("notificaciones_config")
    .select("*")
    .eq("dueno_id", duenoId)
    .maybeSingle();

  if (notif.preferencia === "citas" && cfg && !cfg.recordatorio_citas) return;
  if (notif.preferencia === "vacunas" && cfg && !cfg.recordatorio_vacunas) return;

  await crearYNotificar({
    usuarioId: dueno.usuario_id as string,
    tenantId: dueno.tenant_id as string,
    clinicaNombre: clinica.nombre,
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
