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
