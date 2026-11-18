import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { logoPublicUrl } from "@/lib/data/clinica";

import { enviarEmail } from "./email";
import type { Mensaje } from "./mensajes";
import { plantillaEmail, type ClinicaCorreo } from "./plantilla-email";
import { enviarPush } from "./push";

export interface NotificarInput {
  usuarioId: string;
  // Clínica de la que viene la notificación (spec 6): se guarda con ella y su
  // marca va en el correo y el push (spec 8).
  tenantId: string;
  clinica: ClinicaCorreo;
  mensaje: Mensaje;
  referenciaTipo?: string;
  referenciaId?: string;
  // Contacto y preferencias (si se omiten, se envía por ambos canales).
  email?: string | null;
  canalEmail?: boolean;
  canalPush?: boolean;
}

// Datos de marca y contacto de una clínica para la plantilla de correo.
export async function clinicaCorreo(tenantId: string): Promise<(ClinicaCorreo & { activo: boolean }) | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("nombre, logo_url, direccion, ciudad, telefono, email, activo")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data) return null;
  return {
    nombre_clinica: data.nombre as string,
    logo_url: logoPublicUrl(data.logo_url as string | null),
    direccion: data.direccion as string | null,
    ciudad: data.ciudad as string | null,
    telefono: data.telefono as string | null,
    email: data.email as string | null,
    activo: data.activo as boolean,
  };
}

// URL absoluta para el botón del correo.
function absoluta(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${url}`;
}

// Correo de un mensaje con la marca de la clínica. Devuelve si se envió.
export function enviarMensajePorCorreo(
  to: string,
  clinica: ClinicaCorreo,
  m: Mensaje,
): Promise<boolean> {
  const { html, text } = plantillaEmail(clinica, {
    titulo: m.titulo,
    parrafos: m.parrafos,
    boton: { texto: m.boton, url: absoluta(m.url) },
  });
  return enviarEmail({
    to,
    subject: `${m.titulo} · ${clinica.nombre_clinica}`,
    html,
    text,
    remitente: clinica.nombre_clinica,
    responderA: clinica.email,
  });
}

// Crea la notificación in-app (idempotente por referencia) y despacha email/push.
export async function crearYNotificar(input: NotificarInput): Promise<void> {
  const admin = createAdminClient();
  const m = input.mensaje;

  const { error } = await admin.from("notificaciones").insert({
    tenant_id: input.tenantId,
    usuario_id: input.usuarioId,
    tipo: m.tipo,
    titulo: m.titulo,
    cuerpo: m.cuerpo,
    url: m.url,
    referencia_tipo: input.referenciaTipo ?? null,
    referencia_id: input.referenciaId ?? null,
  });

  // 23505 = ya existía una notificación para (usuario, tipo, referencia): no reenviar.
  if (error) {
    if (error.code === "23505") return;
    console.error("crearYNotificar:", error.message);
  }

  // Un correo que no sale queda registrado (enviarEmail) y no interrumpe nada.
  if (input.canalEmail !== false && input.email) {
    await enviarMensajePorCorreo(input.email, input.clinica, m);
  }
  if (input.canalPush !== false) {
    await enviarPush(input.usuarioId, {
      title: `${input.clinica.nombre_clinica} · ${m.titulo}`,
      body: m.cuerpo,
      url: m.url,
    });
  }
}

export interface NotificarDuenoInput {
  mensaje: Mensaje;
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
  const clinica = await clinicaCorreo(dueno.tenant_id as string);
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
    clinica,
    mensaje: notif.mensaje,
    referenciaTipo: notif.referenciaTipo,
    referenciaId: notif.referenciaId,
    email: (dueno.email as string | null) ?? null,
    canalEmail: cfg ? cfg.canal_email : true,
    canalPush: cfg ? cfg.canal_push : true,
  });
}
