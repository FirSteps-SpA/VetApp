import Link from "next/link";
import type { Metadata } from "next";

import { getCitasRango } from "@/lib/data/citas";
import {
  colorEstadoCita,
  iconoEspecie,
  labelEstadoCita,
  type CitaConRel,
} from "@/lib/types/db";
import {
  etiquetaDia,
  formatearHora,
  inicioSemana,
  isoDia,
} from "@/lib/utils/format";

import { CitaActions } from "./cita-actions";

export const metadata: Metadata = {
  title: "Agenda",
};

type Vista = "dia" | "semana";

function parseFecha(s?: string): Date {
  if (s) {
    const d = new Date(`${s}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

function CitaCard({ cita }: { cita: CitaConRel }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="w-12 shrink-0 text-sm font-semibold text-slate-700">
        {formatearHora(cita.fecha_hora)}
      </div>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100">
        {cita.paciente ? iconoEspecie(cita.paciente.especie) : "🐾"}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/pacientes/${cita.paciente_id}`}
          className="text-sm font-medium text-slate-800 hover:underline"
        >
          {cita.paciente?.nombre ?? "—"}
        </Link>
        <p className="truncate text-xs text-slate-500">
          {cita.motivo}
          {cita.dueno ? ` · ${cita.dueno.nombre}` : ""}
        </p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstadoCita(cita.estado)}`}
      >
        {labelEstadoCita(cita.estado)}
      </span>
      <CitaActions
        citaId={cita.id}
        pacienteId={cita.paciente_id}
        estado={cita.estado}
        consultaId={cita.consulta_id}
      />
    </div>
  );
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { vista?: string; fecha?: string };
}) {
  const vista: Vista = searchParams.vista === "semana" ? "semana" : "dia";
  const fecha = parseFecha(searchParams.fecha);

  let desde: Date;
  let hasta: Date;
  if (vista === "semana") {
    desde = inicioSemana(fecha);
    hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 7);
  } else {
    desde = new Date(fecha);
    hasta = new Date(fecha);
    hasta.setDate(hasta.getDate() + 1);
  }

  const citas = await getCitasRango(desde.toISOString(), hasta.toISOString());

  // Navegación.
  const paso = vista === "semana" ? 7 : 1;
  const prev = new Date(fecha);
  prev.setDate(prev.getDate() - paso);
  const next = new Date(fecha);
  next.setDate(next.getDate() + paso);
  const href = (d: Date, v: Vista = vista) =>
    `/agenda?vista=${v}&fecha=${isoDia(d)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Agenda</h1>
        <Link
          href={`/agenda/nueva-cita?fecha=${isoDia(fecha)}`}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + Nueva cita
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link href={href(prev)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100">
            ←
          </Link>
          <Link href={href(new Date())} className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
            Hoy
          </Link>
          <Link href={href(next)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100">
            →
          </Link>
          <span className="ml-2 text-sm text-slate-600">
            {vista === "semana"
              ? `Semana del ${etiquetaDia(desde)}`
              : etiquetaDia(fecha)}
          </span>
        </div>
        <div className="flex gap-1">
          {(["dia", "semana"] as Vista[]).map((v) => (
            <Link
              key={v}
              href={href(fecha, v)}
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                vista === v
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {v === "dia" ? "Día" : "Semana"}
            </Link>
          ))}
        </div>
      </div>

      {vista === "dia" ? (
        citas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Sin citas este día.
          </div>
        ) : (
          <div className="space-y-2">
            {citas.map((c) => (
              <CitaCard key={c.id} cita={c} />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = new Date(desde);
            dia.setDate(dia.getDate() + i);
            const delDia = citas.filter(
              (c) => isoDia(new Date(c.fecha_hora)) === isoDia(dia),
            );
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-2">
                <Link
                  href={href(dia, "dia")}
                  className="block border-b border-slate-100 pb-1 text-xs font-semibold text-slate-600 hover:text-teal-700"
                >
                  {etiquetaDia(dia)}
                </Link>
                <div className="mt-1 space-y-1">
                  {delDia.length === 0 ? (
                    <p className="text-xs text-slate-300">—</p>
                  ) : (
                    delDia.map((c) => (
                      <Link
                        key={c.id}
                        href={`/pacientes/${c.paciente_id}`}
                        className={`block truncate rounded px-1.5 py-1 text-xs ${colorEstadoCita(c.estado)}`}
                      >
                        {formatearHora(c.fecha_hora)} {c.paciente?.nombre ?? ""}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
