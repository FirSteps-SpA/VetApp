// Calcula la edad legible a partir de la fecha de nacimiento (ISO date).
export function calcularEdad(fechaNacimiento: string | null): string | null {
  if (!fechaNacimiento) return null;

  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - nacimiento.getMonth());
  if (hoy.getDate() < nacimiento.getDate()) meses -= 1;
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

// Formatea una fecha ISO a dd/mm/aaaa.
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatearPeso(peso: number | null): string {
  return peso == null ? "—" : `${peso} kg`;
}

// Hora local HH:mm a partir de un timestamptz ISO.
export function formatearHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Fecha + hora legible.
export function formatearFechaHora(iso: string): string {
  return `${formatearFecha(iso)} ${formatearHora(iso)}`;
}

// YYYY-MM-DD de una fecha (local).
export function isoDia(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// Lunes (00:00) de la semana que contiene a la fecha dada.
export function inicioSemana(d: Date): Date {
  const r = new Date(d);
  const dow = (r.getDay() + 6) % 7; // 0 = lunes
  r.setDate(r.getDate() - dow);
  r.setHours(0, 0, 0, 0);
  return r;
}

// Etiqueta de día legible (ej. "lun 28 jun").
export function etiquetaDia(d: Date): string {
  return d.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
