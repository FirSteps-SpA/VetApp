import Link from "next/link";
import type { Metadata } from "next";

import { getMisCitas, getMisMascotas } from "@/lib/data/portal";
import { colorEstadoCita, iconoEspecie, labelEstadoCita } from "@/lib/types/db";
import { formatearFechaHora } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Portal",
};

export default async function PortalHome() {
  const [mascotas, citas] = await Promise.all([
    getMisMascotas(),
    getMisCitas(),
  ]);

  const proximas = citas.filter(
    (c) =>
      new Date(c.fecha_hora) >= new Date() &&
      (c.estado === "pendiente" || c.estado === "confirmada"),
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-900">
          Mis mascotas
        </h1>
        {mascotas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay mascotas asociadas a tu cuenta.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {mascotas.map((m) => (
              <Link
                key={m.id}
                href={`/portal/mascotas/${m.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-teal-300"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-xl">
                  {iconoEspecie(m.especie)}
                </span>
                <div>
                  <p className="font-medium text-slate-800">{m.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {m.raza ?? m.especie} · {m.numero_ficha}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Próximas citas
          </h2>
          <Link href="/portal/citas" className="text-sm text-teal-700 hover:underline">
            Ver todas
          </Link>
        </div>
        {proximas.length === 0 ? (
          <p className="text-sm text-slate-500">No tienes citas próximas.</p>
        ) : (
          <div className="space-y-2">
            {proximas.map((c) => (
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
      </section>
    </div>
  );
}
