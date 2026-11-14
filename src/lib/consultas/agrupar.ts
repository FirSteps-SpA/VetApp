// Agrupa los controles bajo su consulta de origen para la ficha, el panel de
// exportación y el PDF del historial, para que los tres coincidan.

interface ConsultaBase {
  id: string;
  fecha: string;
  consulta_origen_id: string | null;
}

export type EntradaHistorial<T extends ConsultaBase> =
  // Consulta (o control antiguo sin origen) con sus controles, del más antiguo
  // al más reciente.
  | { tipo: "consulta"; consulta: T; controles: T[] }
  // Control cuyo origen quedó fuera de `incluidas` (p. ej. fuera del rango de
  // fechas): se muestra suelto con la fecha de su consulta de origen.
  | { tipo: "control"; control: T; origenFecha: string | null };

const porFecha = (a: { fecha: string }, b: { fecha: string }) =>
  a.fecha.localeCompare(b.fecha);

// `incluidas`: lo que se muestra (todo, o lo que cae en el rango). `todas`: la
// lista completa del paciente, para encontrar la fecha de los orígenes que
// quedaron fuera. Entradas de la más reciente a la más antigua.
export function agruparControles<T extends ConsultaBase>(
  incluidas: T[],
  todas: T[] = incluidas,
): EntradaHistorial<T>[] {
  const principales = new Map<string, T[]>();
  for (const c of incluidas) {
    if (!c.consulta_origen_id) principales.set(c.id, []);
  }

  const entradas: { fecha: string; entrada: EntradaHistorial<T> }[] = [];
  for (const c of incluidas) {
    if (!c.consulta_origen_id) continue;
    const hermanos = principales.get(c.consulta_origen_id);
    if (hermanos) {
      hermanos.push(c);
    } else {
      const origen = todas.find((o) => o.id === c.consulta_origen_id);
      entradas.push({
        fecha: c.fecha,
        entrada: { tipo: "control", control: c, origenFecha: origen?.fecha ?? null },
      });
    }
  }

  for (const c of incluidas) {
    if (c.consulta_origen_id) continue;
    const controles = principales.get(c.id)!.sort(porFecha);
    entradas.push({ fecha: c.fecha, entrada: { tipo: "consulta", consulta: c, controles } });
  }

  return entradas.sort((a, b) => porFecha(b, a)).map((e) => e.entrada);
}

// Cantidad de consultas (sin contar sus controles) y de controles mostrados.
export function contarHistorial<T extends ConsultaBase>(
  entradas: EntradaHistorial<T>[],
): { consultas: number; controles: number } {
  let consultas = 0;
  let controles = 0;
  for (const e of entradas) {
    if (e.tipo === "consulta") {
      consultas++;
      controles += e.controles.length;
    } else {
      controles++;
    }
  }
  return { consultas, controles };
}
