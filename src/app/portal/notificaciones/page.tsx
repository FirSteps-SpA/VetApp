import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/card";
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
      <Link
        href="/portal"
        className="text-support text-text-muted hover:text-text"
      >
        ← Portal
      </Link>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-section font-semibold text-text">Notificaciones</h1>
          {notificaciones.some((n) => !n.leida) && <MarcarLeidasButton />}
        </div>
        {notificaciones.length === 0 ? (
          <p className="text-body text-text-muted">No tienes notificaciones.</p>
        ) : (
          <div className="space-y-2">
            {notificaciones.map((n) => {
              const contenido = (
                <>
                  <p className="text-body font-medium text-text">{n.titulo}</p>
                  {n.cuerpo && (
                    <p className="text-body text-text-muted">{n.cuerpo}</p>
                  )}
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatearFechaHora(n.created_at)}
                  </p>
                </>
              );
              const clase = `block rounded-card border p-3 ${
                n.leida
                  ? "border-border bg-surface-raised"
                  : "border-accent bg-accent-subtle"
              }`;
              return n.url ? (
                <Link
                  key={n.id}
                  href={n.url}
                  className={`${clase} transition-colors hover:border-accent`}
                >
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

      <Card as="section" className="p-5">
        <h2 className="mb-3 text-body font-semibold text-text">Preferencias</h2>
        {config ? (
          <PreferenciasForm inicial={config} />
        ) : (
          <p className="text-body text-text-muted">
            No se encontró tu registro de dueño.
          </p>
        )}
        <div className="mt-4 border-t border-border pt-4">
          <PushToggle />
        </div>
      </Card>
    </div>
  );
}
