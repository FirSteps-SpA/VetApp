import { describe, expect, it } from "vitest";

import {
  mensajeHoraCancelada,
  mensajeHoraConfirmada,
  mensajeHoraRechazada,
  mensajeInvitacion,
  mensajeRecordatorioCita,
  mensajeRecordatorioVacuna,
} from "./mensajes";
import { direccionDe, plantillaEmail, remitenteDe, urlSegura } from "./plantilla-email";

const clinica = {
  nombre_clinica: "Clínica Pradera",
  logo_url: "https://x.supabase.co/storage/v1/object/public/clinica-assets/t1/logo.png",
  direccion: "Av. 1",
  ciudad: "Talca",
  telefono: "+56 9 1",
  email: "contacto@pradera.cl",
};

describe("remitente", () => {
  it("nombre de la clínica con la dirección de VetApp", () => {
    expect(remitenteDe("Clínica Pradera", "avisos@vetapp.cl")).toBe('"Clínica Pradera" <avisos@vetapp.cl>');
  });
  it("acepta RESEND_FROM con nombre", () => {
    expect(direccionDe("VetApp <avisos@vetapp.cl>")).toBe("avisos@vetapp.cl");
    expect(remitenteDe("Pradera", "VetApp <avisos@vetapp.cl>")).toBe('"Pradera" <avisos@vetapp.cl>');
  });
  it("sanea caracteres que romperían el encabezado", () => {
    expect(remitenteDe('Vet "X" <a>\r\nBcc: y', "a@b.cl")).toBe('"Vet X aBcc: y" <a@b.cl>');
    expect(remitenteDe("  ", "a@b.cl")).toBe("a@b.cl");
  });
});

describe("urlSegura", () => {
  it("solo http(s)", () => {
    expect(urlSegura("https://vetapp.cl/portal")).toBe("https://vetapp.cl/portal");
    expect(urlSegura("javascript:alert(1)")).toBeNull();
    expect(urlSegura("/portal")).toBeNull();
    expect(urlSegura(null)).toBeNull();
  });
});

describe("plantillaEmail", () => {
  const { html, text } = plantillaEmail(clinica, {
    titulo: "Recordatorio",
    parrafos: ["Luna <b>&</b> Tom"],
    boton: { texto: "Ver", url: "https://vetapp.cl/portal/citas" },
  });
  it("marca y contacto de la clínica", () => {
    expect(html).toContain(clinica.logo_url);
    expect(html).toContain("Av. 1, Talca");
    expect(html).toContain("contacto@pradera.cl");
  });
  it("escapa los datos variables", () => {
    expect(html).toContain("Luna &#60;b&#62;&#38;&#60;/b&#62; Tom");
    expect(html).not.toContain("<b>&</b>");
  });
  it("botón y texto plano", () => {
    expect(html).toContain('href="https://vetapp.cl/portal/citas"');
    expect(text).toContain("Ver: https://vetapp.cl/portal/citas");
    expect(text).toContain("Luna <b>&</b> Tom");
  });
  it("sin logo, el nombre; sin URL válida, sin botón", () => {
    const r = plantillaEmail({ ...clinica, logo_url: null }, { titulo: "T", parrafos: [], boton: { texto: "X", url: "javascript:x" } });
    expect(r.html).toContain("Clínica Pradera</span>");
    expect(r.html).not.toContain("javascript:");
  });
});

describe("mensajes", () => {
  it("cada aviso con su tipo, texto y destino", () => {
    expect(mensajeInvitacion({ nombreDueno: "Ana", clinica: "Pradera", enlace: "https://x/c/p/acceso" })).toMatchObject({ tipo: "invitacion", url: "https://x/c/p/acceso" });
    expect(mensajeRecordatorioCita({ mascota: "Luna", cuando: "20-11 10:30" }).cuerpo).toBe("Tienes una cita 20-11 10:30 para Luna.");
    expect(mensajeRecordatorioVacuna({ mascota: null, vacuna: "Triple", fecha: "01-12" }).cuerpo).toBe("Tu mascota: Triple vence el 01-12.");
    expect(mensajeHoraConfirmada({ mascota: "Luna", cuando: "x" }).tipo).toBe("cita_confirmada");
    expect(mensajeHoraRechazada({ mascota: "Luna", motivo: "sin cupo" }).cuerpo).toContain("sin cupo");
    expect(mensajeHoraCancelada({ mascota: "Luna", cuando: "20-11" }).titulo).toBe("Hora cancelada");
  });
});
