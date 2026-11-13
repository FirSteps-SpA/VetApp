import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calcularEdad,
  etiquetaDia,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  formatearPeso,
  inicioSemana,
  isoDia,
} from "./format";

// Se ejecuta con TZ=UTC y TZ=America/Santiago (npm run test): los resultados
// esperados son los mismos en ambas zonas.

// toLocale*String usa espacios especiales (U+202F, U+00A0) que varían entre
// versiones de ICU; se normalizan para comparar el texto visible.
const norm = (s: string) => s.replace(/[\s ]+/g, " ");

// 21:30 del 12 de noviembre en Chile (horario de verano); en UTC ya es el 13.
const NOCHE = "2026-11-13T00:30:00Z";

describe("formatearFecha", () => {
  it("fecha de calendario: el mismo día guardado", () => {
    expect(formatearFecha("2026-03-01")).toBe("01-03-2026");
    expect(formatearFecha("2026-01-01")).toBe("01-01-2026");
  });

  it("instante: el día de la clínica", () => {
    expect(formatearFecha(NOCHE)).toBe("12-11-2026");
  });

  it("vacío o inválido", () => {
    expect(formatearFecha(null)).toBe("—");
    expect(formatearFecha("")).toBe("—");
    expect(formatearFecha("no es fecha")).toBe("—");
  });
});

describe("formatearHora / formatearFechaHora", () => {
  it("hora de la clínica, en el formato actual de es-CL (12 h)", () => {
    expect(norm(formatearHora(NOCHE))).toBe("09:30 p. m.");
    expect(norm(formatearFechaHora(NOCHE))).toBe("12-11-2026 09:30 p. m.");
  });

  it("horario de invierno", () => {
    expect(norm(formatearHora("2026-07-15T14:00:00Z"))).toBe("10:00 a. m.");
  });

  it("inválido", () => {
    expect(formatearHora("no es fecha")).toBe("—");
  });
});

describe("formatearPeso", () => {
  it("con y sin valor", () => {
    expect(formatearPeso(4.5)).toBe("4.5 kg");
    expect(formatearPeso(0)).toBe("0 kg");
    expect(formatearPeso(null)).toBe("—");
  });
});

describe("isoDia", () => {
  it("día de la clínica de un instante", () => {
    expect(isoDia(new Date(NOCHE))).toBe("2026-11-12");
  });
});

describe("inicioSemana", () => {
  it("lunes de la semana", () => {
    expect(inicioSemana("2026-11-13")).toBe("2026-11-09");
    expect(inicioSemana("2026-11-15")).toBe("2026-11-09");
  });

  it("un lunes devuelve el mismo día", () => {
    expect(inicioSemana("2026-11-16")).toBe("2026-11-16");
  });

  it("semana del salto de septiembre", () => {
    expect(inicioSemana("2026-09-06")).toBe("2026-08-31");
  });
});

describe("etiquetaDia", () => {
  it("el mismo día en cualquier zona", () => {
    expect(norm(etiquetaDia("2026-11-13"))).toBe("vie, 13 nov");
    expect(norm(etiquetaDia("2026-09-06"))).toBe("dom, 06 sept");
  });
});

describe("calcularEdad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // En UTC ya es 1 de marzo; en Chile todavía es 28 de febrero (22:00).
    vi.setSystemTime(new Date("2026-03-01T01:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa el día de la clínica, no el de UTC", () => {
    expect(calcularEdad("2025-03-01")).toBe("11 meses");
    expect(calcularEdad("2026-03-01")).toBeNull();
  });

  it("meses y años en singular y plural", () => {
    expect(calcularEdad("2026-02-28")).toBe("0 meses");
    expect(calcularEdad("2026-01-28")).toBe("1 mes");
    expect(calcularEdad("2025-02-28")).toBe("1 año");
    expect(calcularEdad("2024-02-28")).toBe("2 años");
    expect(calcularEdad("2024-12-15")).toBe("1 año 2 meses");
    expect(calcularEdad("2023-01-15")).toBe("3 años 1 mes");
  });

  it("acepta un timestamp y usa su parte de fecha", () => {
    expect(calcularEdad("2025-03-01T00:00:00Z")).toBe("11 meses");
  });

  it("vacía, futura o inválida", () => {
    expect(calcularEdad(null)).toBeNull();
    expect(calcularEdad("2027-01-01")).toBeNull();
    expect(calcularEdad("no es fecha")).toBeNull();
  });
});
