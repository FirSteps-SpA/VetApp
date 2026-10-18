// Zona horaria de la clínica. El servidor (Vercel) corre en UTC y el navegador en
// la zona del usuario: sin fijarla, la misma cita se mostraba con horas distintas
// según dónde se renderizara, y las fechas sin hora (`YYYY-MM-DD`, que JS
// interpreta como medianoche UTC) caían un día antes en Chile.
export const ZONA_CLINICA = "America/Santiago";

const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

// ¿Es una fecha de calendario sin hora (columna `date`)?
export function esFechaCalendario(s: string): boolean {
  return RE_FECHA.test(s);
}

// Fecha de calendario (YYYY-MM-DD) de un instante, en la zona de la clínica.
export function fechaEnZona(d: Date): string {
  // en-CA da el formato ISO YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_CLINICA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function partes(ymd: string): [number, number, number] {
  const m = RE_FECHA.exec(ymd);
  if (!m) throw new Error(`Fecha inválida: ${ymd}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// Suma días a una fecha de calendario (aritmética de calendario, sin zonas).
export function sumarDias(ymd: string, dias: number): string {
  const [y, m, d] = partes(ymd);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

// Día de la semana de una fecha de calendario: 0 = lunes … 6 = domingo.
export function diaSemana(ymd: string): number {
  const [y, m, d] = partes(ymd);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

// Diferencia (minutos) entre la hora de la clínica y UTC en un instante dado.
function desfaseMinutos(instante: number): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_CLINICA,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date(instante))
      .map((x) => [x.type, x.value]),
  );
  const comoUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
  );
  return Math.round((comoUtc - instante) / 60000);
}

// Instante de una fecha y hora de pared (`HH:mm`) en la zona de la clínica,
// independiente de la zona del navegador o del servidor. Horario de verano: se
// prueban los desfases vigentes 12 h antes y después; si la hora no existe (el
// salto de septiembre, 00:00 → 01:00) se usa el primer instante válido posterior.
export function instanteEnZona(ymd: string, hhmm = "00:00"): Date {
  const [y, m, d] = partes(ymd);
  const [h, min] = hhmm.split(":").map(Number);
  const comoUtc = Date.UTC(y, m - 1, d, h, min);
  const desfaseAntes = desfaseMinutos(comoUtc - 12 * 3600_000);
  const desfaseDespues = desfaseMinutos(comoUtc + 12 * 3600_000);
  const buscado = `${ymd} ${hhmm}`;
  for (const desfase of [desfaseAntes, desfaseDespues]) {
    const instante = new Date(comoUtc - desfase * 60000);
    const { fecha, hora } = partesEnZona(instante);
    if (`${fecha} ${hora}` === buscado) return instante;
  }
  return new Date(comoUtc - desfaseAntes * 60000);
}

// Instante en que empieza (00:00) una fecha de calendario en la zona de la clínica.
export function inicioDelDia(ymd: string): Date {
  return instanteEnZona(ymd, "00:00");
}

// Fecha (YYYY-MM-DD) y hora (HH:mm) de pared de un instante, en la zona de la clínica.
export function partesEnZona(d: Date): { fecha: string; hora: string } {
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_CLINICA,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { fecha: fechaEnZona(d), hora };
}
