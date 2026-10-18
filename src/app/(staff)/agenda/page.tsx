import Link from "next/link";
import { Icon } from "@/components/icon";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/button";
import { getCitasRango } from "@/lib/data/citas";
import { colorEstadoCita } from "@/lib/types/db";
import {
  etiquetaDia,
  formatearHora,
  inicioSemana,
  isoDia,
} from "@/lib/utils/format";
import { esFechaCalendario, inicioDelDia, sumarDias } from "@/lib/utils/zona";

import { DiaConDetalle } from "./dia-con-detalle";

export const metadata: Metadata = {
  title: "Agenda",
};

type Vista = "dia" | "semana";

// Fechas de calendario (YYYY-MM-DD) en la zona de la clínica: el servidor corre
// en UTC, así que "hoy" y los límites de día/semana no pueden salir de su reloj.
function parseFecha(s?: string): string {
  return s && esFechaCalendario(s) ? s : isoDia(new Date());
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { vista?: string; fecha?: string };
}) {
  const vista: Vista = searchParams.vista === "semana" ? "semana" : "dia";
  const fecha = parseFecha(searchParams.fecha);

  const desde = vista === "semana" ? inicioSemana(fecha) : fecha;
  const hasta = sumarDias(desde, vista === "semana" ? 7 : 1);

  const citas = await getCitasRango(
    inicioDelDia(desde).toISOString(),
    inicioDelDia(hasta).toISOString(),
  );

  // Navegación.
  const paso = vista === "semana" ? 7 : 1;
  const prev = sumarDias(fecha, -paso);
  const next = sumarDias(fecha, paso);
  const href = (d: string, v: Vista = vista) => `/agenda?vista=${v}&fecha=${d}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-page font-semibold text-text">Agenda</h1>
        <ButtonLink href={`/agenda/nueva-cita?fecha=${fecha}`} size="sm">
          <Icon name="plus" />
          Nueva cita
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link href={href(prev)} className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-control border border-border text-body hover:bg-surface-sunken">
            ←
          </Link>
          <Link href={href(isoDia(new Date()))} className="inline-flex min-h-tap items-center justify-center rounded-control border border-border px-4 text-body hover:bg-surface-sunken">
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
        <DiaConDetalle citas={citas} />
      ) : (
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = sumarDias(desde, i);
            const delDia = citas.filter(
              (c) => isoDia(new Date(c.fecha_hora)) === dia,
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
