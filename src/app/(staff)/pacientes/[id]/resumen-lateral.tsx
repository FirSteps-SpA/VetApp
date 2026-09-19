import Link from "next/link";

import { Sparkline, type PuntoSerie } from "@/components/sparkline";
import type { ConsultaConVet, Vacuna } from "@/lib/types/db";
import { formatearFecha, isoDia } from "@/lib/utils/format";

// Panel lateral de la ficha: vista rápida que complementa (no reemplaza) los
// tabs de abajo. Solo usa datos que la ficha ya carga — nada nuevo.

function serieDesde(
  consultas: ConsultaConVet[],
  campo: "peso_kg" | "temperatura_c",
): PuntoSerie[] {
  return consultas
    .filter((c) => c[campo] != null)
    .slice()
    .reverse() // getConsultas viene descendente; el sparkline necesita orden cronológico.
    .map((c) => ({ fecha: c.fecha, valor: c[campo] as number }));
}

export function ResumenLateral({
  consultas,
  vacunas,
  pacienteId,
}: {
  consultas: ConsultaConVet[];
  vacunas: Vacuna[];
  pacienteId: string;
}) {
  const historialReciente = consultas.slice(0, 4);
  const hoy = isoDia(new Date());
  const proximasVacunas = vacunas
    .filter((v) => v.proxima_dosis && v.proxima_dosis >= hoy)
    .sort((a, b) => (a.proxima_dosis ?? "").localeCompare(b.proxima_dosis ?? ""))
    .slice(0, 3);

  const serieP = serieDesde(consultas, "peso_kg");
  const serieT = serieDesde(consultas, "temperatura_c");

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-support font-semibold uppercase tracking-wide text-text-muted">
          Historial de consultas
        </h2>
        {historialReciente.length === 0 ? (
          <p className="mt-2 text-support text-text-muted">
            Sin consultas registradas.
          </p>
        ) : (
          <ol className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
            {historialReciente.map((c) => (
              <li key={c.id} className="relative">
                <span
                  className="absolute -left-[15px] top-1 h-2 w-2 rounded-pill bg-accent"
                  aria-hidden
                />
                <p className="text-support text-text-muted">
                  {formatearFecha(c.fecha)}
                </p>
                <p className="truncate text-support font-medium text-text">
                  {c.diagnostico}
                </p>
                <p className="truncate text-[0.6875rem] text-text-muted">
                  {c.veterinario?.nombre ?? "—"}
                </p>
              </li>
            ))}
          </ol>
        )}
        <Link
          href={`/pacientes/${pacienteId}#historial`}
          className="mt-2 inline-block text-support text-accent hover:underline"
        >
          Ver historial completo →
        </Link>
      </section>

      {(serieP.length > 0 || serieT.length > 0) && (
        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
          <h2 className="-mb-2 text-support font-semibold uppercase tracking-wide text-text-muted">
            Evolución
          </h2>
          {serieP.length > 0 && (
            <Sparkline
              puntos={serieP}
              label="Peso"
              unidad="kg"
              tono="accent"
            />
          )}
          {serieT.length > 0 && (
            <Sparkline
              puntos={serieT}
              label="Temperatura"
              unidad="°C"
              tono="accent-secondary"
            />
          )}
        </section>
      )}

      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-support font-semibold uppercase tracking-wide text-text-muted">
          Próximas vacunas
        </h2>
        {proximasVacunas.length === 0 ? (
          <p className="mt-2 text-support text-text-muted">
            Sin dosis programadas.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {proximasVacunas.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-support text-text">
                  {v.nombre_vacuna}
                </span>
                <span className="shrink-0 rounded-pill bg-accent-tertiary-subtle px-2 py-0.5 text-[0.6875rem] font-medium text-text">
                  {formatearFecha(v.proxima_dosis)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
