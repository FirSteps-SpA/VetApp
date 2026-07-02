import Link from "next/link";
import type { Metadata } from "next";

import { getMisCitas } from "@/lib/data/portal";
import { colorEstadoCita, labelEstadoCita } from "@/lib/types/db";
import { formatearFechaHora } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Mis citas",
};

export default async function MisCitasPage() {
  const citas = await getMisCitas();

  return (
    <div>
      <Link href="/portal" className="text-sm text-slate-500 hover:text-slate-700">
        ← Portal
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold text-slate-900">Mis citas</h1>
      {citas.length === 0 ? (
        <p className="text-sm text-slate-500">No tienes citas registradas.</p>
      ) : (
        <div className="space-y-2">
          {citas.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="text-sm text-slate-600">
                {formatearFechaHora(c.fecha_hora)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {c.paciente?.nombre} · {c.motivo}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstadoCita(c.estado)}`}
              >
                {labelEstadoCita(c.estado)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
