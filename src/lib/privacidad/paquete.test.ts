import { describe, expect, it } from "vitest";

import { armarPaqueteDatos, FORMATO_PAQUETE, type EntradaPaquete } from "./paquete";

const entrada: EntradaPaquete = {
  clinica: { nombre_clinica: "Pradera", direccion: "Av. 1", telefono: null, email: "c@p.cl" },
  dueno: { id: "d1", nombre: "Ana", rut: "1-9", telefono: "+569", email: "a@a.cl", direccion: null, comuna: "Talca", sector: null, notas: "NOTA-DUENO" },
  mascotas: [
    {
      mascota: { id: "p1", nombre: "Luna", especie: "gato", raza: null, sexo: "hembra", fecha_nacimiento: "2020-01-01", peso_kg: "4.20", numero_ficha: "PAC-00001", notas: "NOTA-PACIENTE" },
      consultas: [{ fecha: "2026-10-01T12:00:00Z", tipo: "consulta", diagnostico: "dx", tratamiento: "tx", anamnesis: "ANAM", notas: "NOTA-INTERNA" }],
      vacunas: [{ nombre_vacuna: "Triple", fecha_aplicacion: "2026-01-01", proxima_dosis: "2027-01-01", lote: "L1" }],
      recetas: [
        { numero_receta: "REC-00001", fecha: "2026-10-01", medicamentos: [{ nombre: "Omega 3" }], instrucciones_generales: null, vigente: true },
        { numero_receta: "REC-00002", fecha: "2026-10-02", medicamentos: [], instrucciones_generales: null, vigente: false },
      ],
      examenes: [
        { nombre: "visible", tipo: "hemograma", fecha: "2026-10-01", descripcion: null, interno: false },
        { nombre: "INTERNO", tipo: "hemograma", fecha: "2026-10-01", descripcion: null, interno: true },
      ],
    },
  ],
  citas: [{ fecha_hora: "2026-12-01T13:00:00Z", motivo: "Control", estado: "pendiente", paciente_nombre: "Luna", notas: "NOTA-CITA" }],
  preferencias: { recordatorio_citas: false, recordatorio_vacunas: true, canal_email: true, canal_push: false },
  aceptaciones: [{ version: 2, aceptado_en: "2026-11-18T10:00:00Z" }],
};

describe("armarPaqueteDatos", () => {
  const p = armarPaqueteDatos(entrada, new Date("2026-11-18T12:00:00Z"));

  it("identifica formato, fecha y clínica", () => {
    expect(p.formato).toBe(FORMATO_PAQUETE);
    expect(p.generado_en).toBe("2026-11-18T12:00:00.000Z");
    expect(p.clinica.nombre).toBe("Pradera");
  });

  it("incluye dueño, mascotas, citas, preferencias y aceptaciones", () => {
    expect(p.dueno).toEqual({ nombre: "Ana", rut: "1-9", telefono: "+569", email: "a@a.cl", direccion: null, comuna: "Talca", sector: null });
    expect(p.mascotas[0].nombre).toBe("Luna");
    expect(p.mascotas[0].peso_kg).toBe(4.2);
    expect(p.mascotas[0].consultas).toEqual([{ fecha: "2026-10-01T12:00:00Z", tipo: "consulta", diagnostico: "dx", tratamiento: "tx" }]);
    expect(p.citas[0]).toEqual({ fecha_hora: "2026-12-01T13:00:00Z", motivo: "Control", estado: "pendiente", mascota: "Luna" });
    expect(p.preferencias?.recordatorio_citas).toBe(false);
    expect(p.aceptaciones_aviso).toEqual([{ version: 2, aceptado_en: "2026-11-18T10:00:00Z" }]);
  });

  it("no incluye notas internas, anamnesis ni exámenes internos", () => {
    const json = JSON.stringify(p);
    for (const oculto of ["NOTA-DUENO", "NOTA-PACIENTE", "NOTA-INTERNA", "ANAM", "INTERNO", "NOTA-CITA", "\"lote\""]) {
      expect(json).not.toContain(oculto);
    }
  });

  it("solo recetas vigentes", () => {
    expect(p.mascotas[0].recetas.map((r) => r.numero_receta)).toEqual(["REC-00001"]);
  });

  it("sin preferencias guardadas: null", () => {
    expect(armarPaqueteDatos({ ...entrada, preferencias: null }).preferencias).toBeNull();
  });
});
