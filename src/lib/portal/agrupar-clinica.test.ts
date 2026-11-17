import { describe, expect, it } from "vitest";

import { agruparPorClinica } from "./agrupar-clinica";

const m = (id: string, tenant_id: string, clinica_nombre: string) => ({ id, tenant_id, clinica_nombre });

describe("agruparPorClinica", () => {
  it("una sola clínica: un grupo con todo", () => {
    const r = agruparPorClinica([m("a", "t1", "Pradera"), m("b", "t1", "Pradera")]);
    expect(r).toHaveLength(1);
    expect(r[0].items.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("dos clínicas: un grupo por clínica, en orden de aparición", () => {
    const r = agruparPorClinica([
      m("a", "t2", "Bosque"),
      m("b", "t1", "Pradera"),
      m("c", "t2", "Bosque"),
    ]);
    expect(r.map((g) => g.clinica_nombre)).toEqual(["Bosque", "Pradera"]);
    expect(r[0].items.map((x) => x.id)).toEqual(["a", "c"]);
    expect(r[1].items.map((x) => x.id)).toEqual(["b"]);
  });

  it("sin elementos: sin grupos", () => {
    expect(agruparPorClinica([])).toEqual([]);
  });
});
