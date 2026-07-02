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
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg">
        {alerta.paciente ? iconoEspecie(alerta.paciente.especie) : "🐾"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {alerta.paciente?.nombre ?? "—"}{" "}
          <span className="text-slate-400">
            {alerta.paciente?.numero_ficha}
          </span>
        </p>
        <p className="truncate text-xs text-slate-500">
          {alerta.nombre_vacuna} · prevista{" "}
          {formatearFecha(alerta.proxima_dosis)}
        </p>
        {alerta.dueno && (
          <p className="truncate text-xs text-slate-500">
            {alerta.dueno.nombre} ·{" "}
            <a
              href={`tel:${alerta.dueno.telefono}`}
              className="text-teal-700 hover:underline"
            >
              {alerta.dueno.telefono}
            </a>
          </p>
        )}
      </div>
      <Link
        href={`/pacientes/${alerta.paciente_id}`}
        className="shrink-0 text-xs font-medium text-teal-700 hover:underline"
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
      <h1 className="text-2xl font-semibold text-slate-900">Vacunas</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-red-700">
          Vencidas ({vencidas.length})
        </h2>
        {vencidas.length === 0 ? (
          <p className="text-sm text-slate-500">Sin vacunas vencidas.</p>
        ) : (
          vencidas.map((a) => <Fila key={a.id} alerta={a} />)
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-amber-700">
          Próximas 30 días ({proximas.length})
        </h2>
        {proximas.length === 0 ? (
          <p className="text-sm text-slate-500">Sin vacunas próximas.</p>
        ) : (
          proximas.map((a) => <Fila key={a.id} alerta={a} />)
        )}
      </section>
    </div>
  );
}
