import { describe, expect, it } from "vitest";

import { plantillaAviso } from "./plantilla";

const base = {
  nombre_clinica: "Clínica Pradera",
  direccion: "Av. Siempre Viva 123",
  ciudad: "Talca",
  telefono: "+56 9 1234 5678",
  email: "contacto@pradera.cl",
};

describe("plantillaAviso", () => {
  it("completa los datos de la clínica", () => {
    const t = plantillaAviso(base);
    expect(t).toContain("AVISO DE PRIVACIDAD — Clínica Pradera");
    expect(t).toContain("con domicilio en Av. Siempre Viva 123, Talca");
    expect(t).toContain("Contacto: contacto@pradera.cl · +56 9 1234 5678.");
    expect(t).toContain("escribiendo a contacto@pradera.cl");
  });

  it("incluye derechos y política de retención", () => {
    const t = plantillaAviso(base);
    expect(t).toMatch(/6\. Tus derechos/);
    expect(t).toMatch(/7\. Cuánto tiempo los conservamos/);
    expect(t).toContain("descargar tus datos");
  });

  it("sin datos de contacto no deja huecos", () => {
    const t = plantillaAviso({ ...base, direccion: null, ciudad: null, telefono: null, email: null });
    expect(t).not.toContain("null");
    expect(t).not.toContain("con domicilio en");
    expect(t).not.toContain("Contacto:");
    expect(t).toContain("contáctanos en la clínica");
  });
});
