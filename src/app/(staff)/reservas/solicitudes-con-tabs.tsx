"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  colorEstadoCita,
  iconoEspecie,
  labelEstadoCita,
  type CitaConRel,
  type EstadoCita,
} from "@/lib/types/db";
import { formatearFechaHora } from "@/lib/utils/format";

import { SolicitudActions } from "./solicitud-actions";

// Reservas = solicitudes hechas por clientes desde el portal (no la agenda
// completa). Se agrupan por estado real de la cita — no existe un estado
// "reprogramada" en el modelo, así que esa pestaña no se construye (gap
// documentado en el proposal).
type Tab = "pendientes" | "confirmadas" | "canceladas" | "no_asistio";

const TABS: { id: Tab; label: string; estados: EstadoCita[] }[] = [
  { id: "pendientes", label: "Pendientes", estados: ["pendiente"] },
  {
    id: "confirmadas",
    label: "Confirmadas",
    estados: ["confirmada", "en_consulta", "realizada"],
  },
  { id: "canceladas", label: "Canceladas", estados: ["cancelada"] },
  { id: "no_asistio", label: "No asistió", estados: ["no_asistio"] },
];

function soloDigitos(tel: string): string {
  return tel.replace(/\D/g, "");
}

export function SolicitudesConTabs({
  solicitudes,
}: {
  solicitudes: CitaConRel[];
}) {
  const [tab, setTab] = useState<Tab>("pendientes");
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);

  const porTab = useMemo(() => {
    const map = new Map<Tab, CitaConRel[]>();
    for (const t of TABS) {
      map.set(
        t.id,
        solicitudes.filter((s) => t.estados.includes(s.estado)),
      );
    }
    return map;
  }, [solicitudes]);

  const lista = porTab.get(tab) ?? [];
  const seleccionada = lista.find((s) => s.id === seleccionadaId) ?? null;

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const n = porTab.get(t.id)?.length ?? 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSeleccionadaId(null);
              }}
              className={`inline-flex min-h-tap shrink-0 items-center gap-1.5 border-b-2 px-3 text-body font-medium transition-colors ${
                tab === t.id
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {t.label}
              {n > 0 && (
                <span className="text-xs text-text-muted">{n}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 desktop:grid-cols-[1fr_20rem] desktop:items-start">
        {lista.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-body text-text-muted">
            Sin solicitudes en esta categoría.
          </div>
        ) : (
          <div className="space-y-2">
            {lista.map((s) => {
              const activa = s.id === seleccionadaId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeleccionadaId(s.id)}
                  className={`flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors ${
                    activa
                      ? "border-accent bg-accent-subtle"
                      : "border-border bg-surface hover:border-accent"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-surface-sunken text-lg">
                    {s.paciente ? iconoEspecie(s.paciente.especie) : "🐾"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-support font-medium text-text">
                      {s.paciente?.nombre ?? "—"}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {formatearFechaHora(s.fecha_hora)} · {s.motivo}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-pill px-2 py-0.5 text-xs font-medium ${colorEstadoCita(s.estado)}`}
                  >
                    {labelEstadoCita(s.estado)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {seleccionada && (
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-surface-sunken text-xl">
                {seleccionada.paciente
                  ? iconoEspecie(seleccionada.paciente.especie)
                  : "🐾"}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/pacientes/${seleccionada.paciente_id}`}
                  className="truncate font-medium text-text hover:underline"
                >
                  {seleccionada.paciente?.nombre ?? "—"}
                </Link>
                <span
                  className={`block w-fit rounded-pill px-2 py-0.5 text-xs font-medium ${colorEstadoCita(seleccionada.estado)}`}
                >
                  {labelEstadoCita(seleccionada.estado)}
                </span>
              </div>
            </div>

            <dl className="mt-3 space-y-2 border-t border-border pt-3 text-support">
              <div>
                <dt className="text-text-muted">Preferencia horaria</dt>
                <dd className="text-text">
                  {formatearFechaHora(seleccionada.fecha_hora)}
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

            {seleccionada.dueno && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
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
              </div>
            )}

            {seleccionada.estado === "pendiente" && (
              <div className="mt-3 border-t border-border pt-3">
                <SolicitudActions
                  citaId={seleccionada.id}
                  fechaHora={seleccionada.fecha_hora}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
