// Plantilla de los correos a los dueños (spec 8): marca y contacto de la
// clínica, mensaje, botón a la acción y versión en texto plano. Pura (sin
// red ni servidor) para testearla; todo dato variable se escapa.

export interface ClinicaCorreo {
  nombre_clinica: string;
  logo_url: string | null; // URL pública ya resuelta
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
}

export interface ContenidoCorreo {
  titulo: string;
  parrafos: string[];
  boton?: { texto: string; url: string } | null;
}

export function escaparHtml(t: string): string {
  return t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Solo URLs http(s): un `javascript:` u otro esquema no llega al botón.
export function urlSegura(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// Dirección de `RESEND_FROM`, aceptando también el formato "Nombre <dir>".
export function direccionDe(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim();
}

// "Nombre de la clínica <dir>", con el nombre sin caracteres que rompan el
// encabezado (comillas, ángulos, saltos de línea) y entre comillas.
export function remitenteDe(nombreClinica: string, from: string): string {
  const nombre = nombreClinica.replace(/["\\<>\r\n]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
  const dir = direccionDe(from);
  return nombre ? `"${nombre}" <${dir}>` : dir;
}

function contactoDe(c: ClinicaCorreo): string[] {
  return [
    [c.direccion, c.ciudad].filter(Boolean).join(", "),
    c.telefono ?? "",
    c.email ?? "",
  ].filter(Boolean);
}

export function plantillaEmail(clinica: ClinicaCorreo, contenido: ContenidoCorreo): { html: string; text: string } {
  const e = escaparHtml;
  const url = urlSegura(contenido.boton?.url);
  const logo = urlSegura(clinica.logo_url);
  const contacto = contactoDe(clinica);

  const encabezado = logo
    ? `<img src="${e(logo)}" alt="${e(clinica.nombre_clinica)}" height="56" style="display:block;max-height:56px;border:0">`
    : `<span style="font-size:20px;font-weight:600;color:#1f2937">${e(clinica.nombre_clinica)}</span>`;
  const parrafos = contenido.parrafos
    .map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#1f2937">${e(p)}</p>`)
    .join("");
  const boton =
    url && contenido.boton
      ? `<p style="margin:20px 0"><a href="${e(url)}" style="display:inline-block;background:#4d5b3a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600">${e(contenido.boton.texto)}</a></p>`
      : "";
  const pie = [clinica.nombre_clinica, ...contacto].map(e).join(" · ");

  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#f4f4f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:24px 0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif">
<tr><td style="padding:24px 28px 8px">${encabezado}</td></tr>
<tr><td style="padding:8px 28px 4px"><h1 style="margin:0 0 12px;font-size:20px;color:#1f2937">${e(contenido.titulo)}</h1>${parrafos}${boton}</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${pie}<br>Recibes este correo porque eres cliente de ${e(clinica.nombre_clinica)}. Puedes cambiar tus avisos en el portal, sección Alertas.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    clinica.nombre_clinica,
    "",
    contenido.titulo,
    "",
    ...contenido.parrafos,
    ...(url && contenido.boton ? ["", `${contenido.boton.texto}: ${url}`] : []),
    "",
    "--",
    [clinica.nombre_clinica, ...contacto].join(" · "),
  ].join("\n");

  return { html, text };
}
