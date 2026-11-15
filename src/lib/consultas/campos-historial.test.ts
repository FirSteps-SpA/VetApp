import { describe, expect, it } from "vitest";

import { camposConsultaHistorial } from "./campos-historial";

const completa = {
  consulta_origen_id: null,
  motivo: "Cojera",
  anamnesis: "Desde ayer",
  examen_fisico: "Dolor en carpo",
  diagnostico: "Esguince carpo",
  diagnostico_diferencial: "Fractura",
  tratamiento: "Reposo",
  peso_kg: 4.2,
  temperatura_c: 38.6,
  notas: "Paciente nervioso",
  evolucion: null,
};

const todas = { incluirAnamnesis: true, incluirSignosVitales: true, incluirNotasInternas: true };
const labels = (cs: { label: string }[]) => cs.map((c) => c.label);

describe("camposConsultaHistorial", () => {
  it("consulta completa en el orden del detalle, diferencial antes que diagnóstico", () => {
    const r = camposConsultaHistorial(completa, todas);
    expect(labels(r)).toEqual([
      "Motivo",
      "Anamnesis",
      "Examen físico",
      "Peso",
      "Temperatura",
      "Diagnóstico diferencial",
      "Diagnóstico",
      "Tratamiento",
      "Notas",
    ]);
    expect(r.find((c) => c.label === "Peso")?.valor).toBe("4.2 kg");
    expect(r.find((c) => c.label === "Temperatura")?.valor).toBe("38.6 °C");
    expect(r.find((c) => c.label === "Notas")?.tenue).toBe(true);
  });

  it("omite los campos vacíos", () => {
    const r = camposConsultaHistorial(
      { ...completa, anamnesis: "  ", diagnostico_diferencial: null, temperatura_c: null },
      todas,
    );
    expect(labels(r)).not.toContain("Anamnesis");
    expect(labels(r)).not.toContain("Diagnóstico diferencial");
    expect(labels(r)).not.toContain("Temperatura");
    expect(labels(r)).toContain("Examen físico");
  });

  it("cada opción desactivada quita sus campos", () => {
    expect(labels(camposConsultaHistorial(completa, { ...todas, incluirAnamnesis: false }))).toEqual([
      "Motivo",
      "Peso",
      "Temperatura",
      "Diagnóstico diferencial",
      "Diagnóstico",
      "Tratamiento",
      "Notas",
    ]);
    const sinVitales = labels(camposConsultaHistorial(completa, { ...todas, incluirSignosVitales: false }));
    expect(sinVitales).not.toContain("Peso");
    expect(sinVitales).not.toContain("Temperatura");
    expect(labels(camposConsultaHistorial(completa, { ...todas, incluirNotasInternas: false }))).not.toContain(
      "Notas",
    );
  });

  const control = {
    ...completa,
    consulta_origen_id: "c1",
    anamnesis: null,
    examen_fisico: null,
    notas: null,
    evolucion: "Mejoría",
    tratamiento: "Suspender reposo",
    peso_kg: 4.3,
    temperatura_c: null,
  };

  it("control con su origen: evolución primero y sin repetir motivo ni diagnósticos", () => {
    expect(labels(camposConsultaHistorial(control, todas, completa))).toEqual([
      "Evolución",
      "Peso",
      "Tratamiento",
    ]);
  });

  it("control sin origen en el documento: muestra motivo y diagnósticos", () => {
    expect(labels(camposConsultaHistorial(control, todas, null))).toEqual([
      "Evolución",
      "Motivo",
      "Peso",
      "Diagnóstico diferencial",
      "Diagnóstico",
      "Tratamiento",
    ]);
  });

  it("control que ajusta el diagnóstico: lo muestra", () => {
    const r = camposConsultaHistorial({ ...control, diagnostico: "Tendinitis" }, todas, completa);
    expect(labels(r)).toEqual(["Evolución", "Peso", "Diagnóstico", "Tratamiento"]);
    expect(r.find((c) => c.label === "Diagnóstico")?.valor).toBe("Tendinitis");
  });

  it("compara sin espacios en los extremos y con null como vacío", () => {
    const origen = { ...completa, diagnostico_diferencial: null };
    const r = camposConsultaHistorial(
      { ...control, motivo: " Cojera ", diagnostico_diferencial: "" },
      todas,
      origen,
    );
    expect(labels(r)).toEqual(["Evolución", "Peso", "Tratamiento"]);
  });

  it("un diferencial que el control borró no se imprime", () => {
    const r = camposConsultaHistorial({ ...control, diagnostico_diferencial: null }, todas, completa);
    expect(labels(r)).not.toContain("Diagnóstico diferencial");
  });
});
