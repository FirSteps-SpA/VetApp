import Link from "next/link";
import type { Metadata } from "next";

import { getAlertasVacunas, type AlertaVacuna } from "@/lib/data/vacunas";
import { iconoEspecie } from "@/lib/types/db";
import { formatearFecha } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Vacunas",
};

function Fila({ alerta }: { alerta: AlertaVacuna }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-surface-sunken text-lg">
        {alerta.paciente ? iconoEspecie(alerta.paciente.especie) : "🐾"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-text">
          {alerta.paciente?.nombre ?? "—"}{" "}
          <span className="text-text-muted">
            {alerta.paciente?.numero_ficha}
          </span>
        </p>
        <p className="truncate text-support text-text-muted">
          {alerta.nombre_vacuna} · prevista{" "}
          {formatearFecha(alerta.proxima_dosis)}
        </p>
        {alerta.dueno && (
          <p className="truncate text-support text-text-muted">
            {alerta.dueno.nombre} ·{" "}
            <a
              href={`tel:${alerta.dueno.telefono}`}
              className="text-accent hover:underline"
            >
              {alerta.dueno.telefono}
            </a>
          </p>
        )}
      </div>
      <Link
        href={`/pacientes/${alerta.paciente_id}`}
        className="shrink-0 text-support font-medium text-accent hover:underline"
      >
        Ver ficha
      </Link>
    </div>
  );
}

export default async function VacunasPage() {
  const alertas = await getAlertasVacunas();
  const vencidas = alertas.filter((a) => a.estado_alerta === "vencida");
  const proximas = alertas.filter((a) => a.estado_alerta === "proxima");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-page font-semibold text-text">Vacunas</h1>

      <section className="space-y-2">
        <h2 className="text-body font-semibold text-danger">
          Vencidas ({vencidas.length})
        </h2>
        {vencidas.length === 0 ? (
          <p className="text-body text-text-muted">Sin vacunas vencidas.</p>
        ) : (
          vencidas.map((a) => <Fila key={a.id} alerta={a} />)
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-body font-semibold text-warning">
          Próximas 30 días ({proximas.length})
        </h2>
        {proximas.length === 0 ? (
          <p className="text-body text-text-muted">Sin vacunas próximas.</p>
        ) : (
          proximas.map((a) => <Fila key={a.id} alerta={a} />)
        )}
      </section>
    </div>
  );
}
