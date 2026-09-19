"use client";

import { useState } from "react";
import Link from "next/link";

import {
  colorEstadoCita,
  iconoEspecie,
  labelEstadoCita,
  type CitaConRel,
} from "@/lib/types/db";
import { formatearHora } from "@/lib/utils/format";

import { CitaActions } from "./cita-actions";

// Vista "Día" con panel de detalle: la lista es la misma información de
// siempre, pero seleccionar una cita muestra su detalle (tutor, contacto,
// acciones) al costado en vez de tener que abrir la ficha para verlo.

function soloDigitos(tel: string): string {
  return tel.replace(/\D/g, "");
}

export function DiaConDetalle({ citas }: { citas: CitaConRel[] }) {
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(
    citas[0]?.id ?? null,
  );
  const seleccionada = citas.find((c) => c.id === seleccionadaId) ?? null;

  if (citas.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-surface-raised p-8 text-center text-body text-text-muted">
        Sin citas este día.
      </div>
    );
  }

  return (
    <div className="grid gap-4 desktop:grid-cols-[1fr_20rem] desktop:items-start">
      <div className="space-y-2">
        {citas.map((c) => {
          const activa = c.id === seleccionadaId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSeleccionadaId(c.id)}
              className={`flex w-full flex-wrap items-center gap-3 rounded-card border p-3 text-left transition-colors tablet:p-2.5 ${
                activa
                  ? "border-accent bg-accent-subtle"
                  : "border-border bg-surface-raised hover:border-accent"
              }`}
            >
              <div className="w-12 shrink-0 text-support font-semibold text-text">
                {formatearHora(c.fecha_hora)}
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-surface-sunken">
                {c.paciente ? iconoEspecie(c.paciente.especie) : "🐾"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-support font-medium text-text">
                  {c.paciente?.nombre ?? "—"}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {c.motivo}
                  {c.dueno ? ` · ${c.dueno.nombre}` : ""}
                </p>
              </div>
              <span
                className={`rounded-pill px-2 py-0.5 text-xs font-medium ${colorEstadoCita(c.estado)}`}
              >
                {labelEstadoCita(c.estado)}
              </span>
            </button>
          );
        })}
      </div>

      {seleccionada && (
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-surface-sunken text-xl">
              {seleccionada.paciente
                ? iconoEspecie(seleccionada.paciente.especie)
                : "🐾"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">
                {seleccionada.paciente?.nombre ?? "—"}
              </p>
              <span
                className={`inline-block rounded-pill px-2 py-0.5 text-xs font-medium ${colorEstadoCita(seleccionada.estado)}`}
              >
                {labelEstadoCita(seleccionada.estado)}
              </span>
            </div>
          </div>

          <dl className="mt-3 space-y-2 border-t border-border pt-3 text-support">
            <div>
              <dt className="text-text-muted">Horario</dt>
              <dd className="text-text">
                {formatearHora(seleccionada.fecha_hora)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Motivo</dt>
              <dd className="text-text">{seleccionada.motivo}</dd>
            </div>
            {seleccionada.dueno && (
              <div>
                <dt className="text-text-muted">Tutor</dt>
                <dd className="text-text">{seleccionada.dueno.nombre}</dd>
              </div>
            )}
          </dl>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {seleccionada.dueno && (
              <>
                <a
                  href={`tel:${seleccionada.dueno.telefono}`}
                  className="inline-flex min-h-tap items-center rounded-control border border-border px-3 text-support font-medium text-text hover:bg-surface-sunken"
                >
                  Llamar
                </a>
                <a
                  href={`https://wa.me/${soloDigitos(seleccionada.dueno.telefono)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-tap items-center rounded-control border border-border px-3 text-support font-medium text-text hover:bg-surface-sunken"
                >
                  WhatsApp
                </a>
              </>
            )}
            <Link
              href={`/pacientes/${seleccionada.paciente_id}`}
              className="inline-flex min-h-tap items-center rounded-control bg-accent px-3 text-support font-medium text-on-accent hover:opacity-90"
            >
              Abrir ficha
            </Link>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <CitaActions
              citaId={seleccionada.id}
              pacienteId={seleccionada.paciente_id}
              estado={seleccionada.estado}
              consultaId={seleccionada.consulta_id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
