import { describe, expect, it } from "vitest";

import { agruparControles, contarHistorial } from "./agrupar";

const c = (id: string, fecha: string, origen: string | null = null) => ({
  id,
  fecha: `${fecha}T12:00:00Z`,
  consulta_origen_id: origen,
});

const consulta = c("c1", "2026-10-01");
const control1 = c("k1", "2026-10-08", "c1");
const control2 = c("k2", "2026-10-15", "c1");
const otra = c("c2", "2026-11-01");
const antiguo = c("v1", "2026-09-01"); // tipo control sin origen (previo a la spec 4)

describe("agruparControles", () => {
  it("agrupa los controles bajo su consulta, del más antiguo al más reciente", () => {
    const r = agruparControles([control2, consulta, control1]);
    expect(r).toEqual([{ tipo: "consulta", consulta, controles: [control1, control2] }]);
  });

  it("ordena las entradas de la más reciente a la más antigua", () => {
    const r = agruparControles([consulta, antiguo, otra, control1]);
    expect(r.map((e) => (e.tipo === "consulta" ? e.consulta.id : e.control.id))).toEqual([
      "c2",
      "c1",
      "v1",
    ]);
  });

  it("un control sin origen cuenta como consulta", () => {
    expect(agruparControles([antiguo])).toEqual([
      { tipo: "consulta", consulta: antiguo, controles: [] },
    ]);
  });

  it("control con su origen fuera del rango: suelto, con la fecha del origen", () => {
    const todas = [consulta, control1, control2, otra];
    const r = agruparControles([control2, otra], todas);
    expect(r).toEqual([
      { tipo: "consulta", consulta: otra, controles: [] },
      { tipo: "control", control: control2, origenFecha: consulta.fecha },
    ]);
  });

  it("origen desconocido: origenFecha null", () => {
    expect(agruparControles([control1], [control1])).toEqual([
      { tipo: "control", control: control1, origenFecha: null },
    ]);
  });
});

describe("contarHistorial", () => {
  it("cuenta consultas sin sus controles, y los controles aparte", () => {
    const todas = [consulta, control1, control2, otra, antiguo];
    expect(contarHistorial(agruparControles(todas))).toEqual({ consultas: 3, controles: 2 });
    expect(contarHistorial(agruparControles([control2, otra], todas))).toEqual({
      consultas: 1,
      controles: 1,
    });
  });
});
