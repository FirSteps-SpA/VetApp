import Link from "next/link";
import { Icon } from "@/components/icon";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/button";
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
      <Link
        href="/portal"
        className="text-support text-text-muted hover:text-text"
      >
        ← Portal
      </Link>
      <div className="mb-4 mt-2 flex items-center justify-between gap-3">
        <h1 className="text-section font-semibold text-text">Mis citas</h1>
        <ButtonLink href="/portal/citas/solicitar" size="sm">
          <Icon name="plus" />
          Solicitar hora
        </ButtonLink>
      </div>
      {citas.length === 0 ? (
        <p className="text-body text-text-muted">
          No tienes citas registradas.
        </p>
      ) : (
        <div className="space-y-2">
          {citas.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-3"
            >
              <span className="text-support text-text-muted">
                {formatearFechaHora(c.fecha_hora)}
              </span>
              <span className="min-w-0 flex-1 truncate text-support text-text">
                {c.paciente?.nombre} · {c.motivo}
              </span>
              <span
                className={`rounded-pill px-2 py-0.5 text-xs font-medium ${colorEstadoCita(c.estado)}`}
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
