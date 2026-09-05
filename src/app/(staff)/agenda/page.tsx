import Link from "next/link";
import { Icon } from "@/components/icon";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/button";
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
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface-raised p-3 tablet:p-2.5">
      <div className="w-12 shrink-0 text-support font-semibold text-text">
        {formatearHora(cita.fecha_hora)}
      </div>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-surface-sunken">
        {cita.paciente ? iconoEspecie(cita.paciente.especie) : "🐾"}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/pacientes/${cita.paciente_id}`}
          className="text-support font-medium text-text hover:underline"
        >
          {cita.paciente?.nombre ?? "—"}
        </Link>
        <p className="truncate text-xs text-text-muted">
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
        <h1 className="text-page font-semibold text-text">Agenda</h1>
        <ButtonLink href={`/agenda/nueva-cita?fecha=${isoDia(fecha)}`} size="sm">
          <Icon name="plus" />
          Nueva cita
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link href={href(prev)} className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-control border border-border text-body hover:bg-surface-sunken">
            ←
          </Link>
          <Link href={href(new Date())} className="inline-flex min-h-tap items-center justify-center rounded-control border border-border px-4 text-body hover:bg-surface-sunken">
            Hoy
          </Link>
          <Link href={href(next)} className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-control border border-border text-body hover:bg-surface-sunken">
            →
          </Link>
          <span className="ml-2 text-support text-text-muted">
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
              className={`inline-flex min-h-tap items-center rounded-control px-3 text-body font-medium ${
                vista === v
                  ? "bg-accent-subtle text-accent"
                  : "text-text-muted hover:bg-surface-sunken"
              }`}
            >
              {v === "dia" ? "Día" : "Semana"}
            </Link>
          ))}
        </div>
      </div>

      {vista === "dia" ? (
        citas.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-raised p-8 text-center text-body text-text-muted">
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
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = new Date(desde);
            dia.setDate(dia.getDate() + i);
            const delDia = citas.filter(
              (c) => isoDia(new Date(c.fecha_hora)) === isoDia(dia),
            );
            return (
              <div key={i} className="rounded-card border border-border bg-surface-raised p-2">
                <Link
                  href={href(dia, "dia")}
                  className="block border-b border-border pb-1 text-xs font-semibold text-text-muted hover:text-accent"
                >
                  {etiquetaDia(dia)}
                </Link>
                <div className="mt-1 space-y-1">
                  {delDia.length === 0 ? (
                    <p className="text-xs text-text-muted opacity-60">—</p>
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
