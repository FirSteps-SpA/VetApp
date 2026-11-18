import "server-only";

import { logError } from "@/lib/log";

import { remitenteDe } from "./plantilla-email";

export interface CorreoSaliente {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Nombre que ve el dueño como remitente (el de la clínica) y adónde van sus
  // respuestas (el email de la clínica), spec 8.
  remitente?: string;
  responderA?: string | null;
}

// Envía un email vía Resend desde la dirección de `RESEND_FROM` (dominio de
// VetApp). Devuelve true si se envió. Sin configuración no falla: solo
// advierte (desarrollo); un rechazo del proveedor se registra en Sentry.
export async function enviarEmail(c: CorreoSaliente): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.warn("Resend no configurado (RESEND_API_KEY / RESEND_FROM).");
    return false;
  }

  try {
    // RESEND_API_URL solo para pruebas locales (un servidor que capture los
    // correos); en producción no se define.
    const res = await fetch(process.env.RESEND_API_URL ?? "https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: c.remitente ? remitenteDe(c.remitente, from) : from,
        to: c.to,
        subject: c.subject,
        html: c.html,
        ...(c.text ? { text: c.text } : {}),
        ...(c.responderA ? { reply_to: c.responderA } : {}),
      }),
    });
    if (!res.ok) {
      logError(new Error(`Resend ${res.status}: ${await res.text()}`), { contexto: "email" });
      return false;
    }
    return true;
  } catch (e) {
    logError(e, { contexto: "email" });
    return false;
  }
}
