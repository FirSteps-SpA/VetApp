import Link from "next/link";
import type { Metadata } from "next";

import { getMiConfig, getMisNotificaciones } from "@/lib/data/portal";
import { formatearFechaHora } from "@/lib/utils/format";

import { MarcarLeidasButton } from "./marcar-leidas";
import { PreferenciasForm } from "./preferencias-form";
import { PushToggle } from "./push-toggle";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default async function NotificacionesPage() {
  const [notificaciones, config] = await Promise.all([
    getMisNotificaciones(),
    getMiConfig(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/portal" className="text-sm text-slate-500 hover:text-slate-700">
        ← Portal
      </Link>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Notificaciones</h1>
          {notificaciones.some((n) => !n.leida) && <MarcarLeidasButton />}
        </div>
        {notificaciones.length === 0 ? (
          <p className="text-sm text-slate-500">No tienes notificaciones.</p>
        ) : (
          <div className="space-y-2">
            {notificaciones.map((n) => {
              const contenido = (
                <>
                  <p className="text-sm font-medium text-slate-800">{n.titulo}</p>
                  {n.cuerpo && <p className="text-sm text-slate-600">{n.cuerpo}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatearFechaHora(n.created_at)}
                  </p>
                </>
              );
              const clase = `block rounded-xl border p-3 ${
                n.leida
                  ? "border-slate-200 bg-white"
                  : "border-teal-200 bg-teal-50"
              }`;
              return n.url ? (
                <Link key={n.id} href={n.url} className={`${clase} hover:border-teal-300`}>
                  {contenido}
                </Link>
              ) : (
                <div key={n.id} className={clase}>
                  {contenido}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Preferencias</h2>
        {config ? (
          <PreferenciasForm inicial={config} />
        ) : (
          <p className="text-sm text-slate-500">
            No se encontró tu registro de dueño.
          </p>
        )}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <PushToggle />
        </div>
      </section>
    </div>
  );
}
