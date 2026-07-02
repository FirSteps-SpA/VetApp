import Link from "next/link";
import type { Metadata } from "next";

import { getSolicitudesPendientes } from "@/lib/data/citas";
import { iconoEspecie } from "@/lib/types/db";
import { formatearFechaHora } from "@/lib/utils/format";

import { SolicitudActions } from "./solicitud-actions";

export const metadata: Metadata = {
  title: "Reservas",
};

export default async function ReservasPage() {
  const solicitudes = await getSolicitudesPendientes();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Solicitudes de hora
      </h1>

      {solicitudes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hay solicitudes pendientes.
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg">
                  {s.paciente ? iconoEspecie(s.paciente.especie) : "🐾"}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/pacientes/${s.paciente_id}`}
                    className="text-sm font-medium text-slate-800 hover:underline"
                  >
                    {s.paciente?.nombre ?? "—"}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    Preferencia: {formatearFechaHora(s.fecha_hora)} · {s.motivo}
                  </p>
                  {s.dueno && (
                    <p className="text-xs text-slate-500">
                      {s.dueno.nombre} · {s.dueno.telefono}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <SolicitudActions citaId={s.id} fechaHora={s.fecha_hora} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
