import { describe, expect, it } from "vitest";

import { rutaEnTenant, rutaEsDeTenant, tenantDeUsuario } from "./storage-rutas";

const A = "00000000-0000-4000-8000-000000000001";
const B = "11111111-2222-4333-8444-555555555555";

describe("tenantDeUsuario", () => {
  it("lee el tenant del JWT", () => {
    expect(tenantDeUsuario({ app_metadata: { tenant_id: A } })).toBe(A);
  });
  it("sin tenant (cliente) o con un valor inválido: null", () => {
    expect(tenantDeUsuario({ app_metadata: { rol: "cliente" } })).toBeNull();
    expect(tenantDeUsuario({ app_metadata: { tenant_id: "x" } })).toBeNull();
    expect(tenantDeUsuario(null)).toBeNull();
  });
});

describe("rutaEnTenant", () => {
  it("antepone la carpeta de la clínica", () => {
    expect(rutaEnTenant(A, "pac1", "perfil.jpg")).toBe(`${A}/pac1/perfil.jpg`);
  });
  it("rechaza un tenant inválido", () => {
    expect(() => rutaEnTenant("", "x")).toThrow();
  });
});

describe("rutaEsDeTenant", () => {
  it("acepta solo rutas de esa clínica", () => {
    expect(rutaEsDeTenant(`${A}/pac1/perfil.jpg`, A)).toBe(true);
    expect(rutaEsDeTenant(`${B}/pac1/perfil.jpg`, A)).toBe(false);
  });
  it("rechaza rutas sin carpeta, vacías o con ..", () => {
    expect(rutaEsDeTenant("pac1/perfil.jpg", A)).toBe(false);
    expect(rutaEsDeTenant(`${A}`, A)).toBe(false);
    expect(rutaEsDeTenant(`${A}/../${B}/x.pdf`, A)).toBe(false);
    expect(rutaEsDeTenant(null, A)).toBe(false);
  });
});
