import { describe, expect, it } from "vitest";
import {
  diaSemana,
  esFechaCalendario,
  fechaEnZona,
  inicioDelDia,
  instanteEnZona,
  partesEnZona,
  sumarDias,
} from "./zona";

// Se ejecuta con TZ=UTC y TZ=America/Santiago (npm run test): los resultados
// esperados son los mismos en ambas zonas.

describe("esFechaCalendario", () => {
  it("reconoce solo YYYY-MM-DD", () => {
    expect(esFechaCalendario("2026-03-01")).toBe(true);
    expect(esFechaCalendario("2026-03-01T00:00:00Z")).toBe(false);
    expect(esFechaCalendario("01-03-2026")).toBe(false);
    expect(esFechaCalendario("")).toBe(false);
  });
});

describe("sumarDias", () => {
  it("cruza meses y años", () => {
    expect(sumarDias("2026-01-31", 1)).toBe("2026-02-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-11-13", 0)).toBe("2026-11-13");
  });

  it("resta días", () => {
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(sumarDias("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("no se ve afectada por los cambios de horario", () => {
    expect(sumarDias("2026-09-05", 1)).toBe("2026-09-06");
    expect(sumarDias("2026-04-04", 1)).toBe("2026-04-05");
  });
});

describe("diaSemana", () => {
  it("lunes = 0 … domingo = 6", () => {
    expect(diaSemana("2026-11-16")).toBe(0);
    expect(diaSemana("2026-11-13")).toBe(4);
    expect(diaSemana("2026-11-15")).toBe(6);
  });

  it("día del salto de septiembre (domingo)", () => {
    expect(diaSemana("2026-09-06")).toBe(6);
  });
});

describe("fechaEnZona / partesEnZona", () => {
  it("un instante de noche sigue en el día de la clínica aunque en UTC ya sea el siguiente", () => {
    const instante = new Date("2026-11-13T00:30:00Z"); // 21:30 del 12 en Chile (verano)
    expect(fechaEnZona(instante)).toBe("2026-11-12");
    expect(partesEnZona(instante)).toEqual({ fecha: "2026-11-12", hora: "21:30" });
  });

  it("horario de invierno", () => {
    const instante = new Date("2026-07-16T03:59:00Z"); // 23:59 del 15 en Chile
    expect(partesEnZona(instante)).toEqual({ fecha: "2026-07-15", hora: "23:59" });
  });
});

describe("instanteEnZona", () => {
  it("horario de invierno (UTC-4)", () => {
    expect(instanteEnZona("2026-07-15", "10:00").toISOString()).toBe("2026-07-15T14:00:00.000Z");
  });

  it("horario de verano (UTC-3)", () => {
    expect(instanteEnZona("2026-01-15", "10:00").toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("hora por defecto 00:00", () => {
    expect(instanteEnZona("2026-07-15").toISOString()).toBe("2026-07-15T04:00:00.000Z");
  });

  it("hora inexistente del salto de septiembre → primer instante válido posterior", () => {
    const instante = instanteEnZona("2026-09-06", "00:00");
    expect(instante.toISOString()).toBe("2026-09-06T04:00:00.000Z");
    expect(partesEnZona(instante)).toEqual({ fecha: "2026-09-06", hora: "01:00" });
  });

  it("hora repetida de abril → primera ocurrencia (aún en verano)", () => {
    expect(instanteEnZona("2026-04-04", "23:30").toISOString()).toBe("2026-04-05T02:30:00.000Z");
  });

  it("ida y vuelta con partesEnZona", () => {
    const instante = instanteEnZona("2026-11-12", "21:30");
    expect(instante.toISOString()).toBe("2026-11-13T00:30:00.000Z");
    expect(partesEnZona(instante)).toEqual({ fecha: "2026-11-12", hora: "21:30" });
  });

  it("rechaza una fecha inválida", () => {
    expect(() => instanteEnZona("13-11-2026", "10:00")).toThrow("Fecha inválida");
  });
});

describe("inicioDelDia", () => {
  it("día siguiente a la hora repetida de abril", () => {
    const inicio = inicioDelDia("2026-04-05");
    expect(inicio.toISOString()).toBe("2026-04-05T04:00:00.000Z");
    expect(fechaEnZona(inicio)).toBe("2026-04-05");
  });

  it("día del salto de septiembre empieza a la 01:00", () => {
    expect(inicioDelDia("2026-09-06").toISOString()).toBe("2026-09-06T04:00:00.000Z");
  });

  it("el instante anterior al inicio es del día previo", () => {
    const inicio = inicioDelDia("2026-11-13");
    expect(fechaEnZona(new Date(inicio.getTime() - 1))).toBe("2026-11-12");
    expect(fechaEnZona(inicio)).toBe("2026-11-13");
  });
});
