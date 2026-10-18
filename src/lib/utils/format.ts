import {
  ZONA_CLINICA,
  diaSemana,
  esFechaCalendario,
  fechaEnZona,
  sumarDias,
} from "./zona";

// Calcula la edad legible a partir de la fecha de nacimiento (ISO date).
export function calcularEdad(fechaNacimiento: string | null): string | null {
  if (!fechaNacimiento) return null;
  // Fecha de calendario: se compara por año/mes/día, sin pasar por UTC.
  const ymd = fechaNacimiento.slice(0, 10);
  if (!esFechaCalendario(ymd)) return null;
  const [ny, nm, nd] = ymd.split("-").map(Number);
  const [hy, hm, hd] = fechaEnZona(new Date()).split("-").map(Number);
  let meses = (hy - ny) * 12 + (hm - nm);
  if (hd < nd) meses -= 1;
  if (meses < 0) return null;

  const anios = Math.floor(meses / 12);
  const restoMeses = meses % 12;

  if (anios === 0) {
    return restoMeses === 1 ? "1 mes" : `${restoMeses} meses`;
  }
  if (restoMeses === 0) {
    return anios === 1 ? "1 año" : `${anios} años`;
  }
  return `${anios} ${anios === 1 ? "año" : "años"} ${restoMeses} ${
    restoMeses === 1 ? "mes" : "meses"
  }`;
}

// Formatea a dd-mm-aaaa. Una fecha de calendario (`YYYY-MM-DD`) se muestra tal
// cual, sin convertirla a instante (JS la tomaría como medianoche UTC y en Chile
// caería el día anterior); un timestamp se muestra en la zona de la clínica.
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  if (esFechaCalendario(fecha)) {
    const [y, m, d] = fecha.split("-");
    return `${d}-${m}-${y}`;
  }
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", {
    timeZone: ZONA_CLINICA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatearPeso(peso: number | null): string {
  return peso == null ? "—" : `${peso} kg`;
}

// Hora HH:mm de un timestamptz ISO, en la zona de la clínica.
export function formatearHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-CL", {
    timeZone: ZONA_CLINICA,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Fecha + hora legible.
export function formatearFechaHora(iso: string): string {
  return `${formatearFecha(iso)} ${formatearHora(iso)}`;
}

// YYYY-MM-DD de un instante, en la zona de la clínica.
export function isoDia(d: Date): string {
  return fechaEnZona(d);
}

// Lunes de la semana que contiene a la fecha de calendario dada.
export function inicioSemana(ymd: string): string {
  return sumarDias(ymd, -diaSemana(ymd));
}

// Etiqueta de día legible (ej. "lun 28 jun") de una fecha de calendario.
export function etiquetaDia(ymd: string): string {
  // Mediodía UTC formateado en UTC: el mismo día en cualquier entorno.
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString("es-CL", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
