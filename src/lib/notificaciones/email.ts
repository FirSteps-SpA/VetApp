import "server-only";

// Envía un email vía Resend. Devuelve true si se envió. Si no está configurado,
// no falla: solo registra una advertencia (útil en desarrollo sin SMTP).
export async function enviarEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.warn("Resend no configurado (RESEND_API_KEY / RESEND_FROM).");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Resend fetch error:", e);
    return false;
  }
}
