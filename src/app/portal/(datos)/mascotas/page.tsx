import Link from "next/link";
import type { Metadata } from "next";

import { getMisMascotas } from "@/lib/data/portal";
import { agruparPorClinica } from "@/lib/portal/agrupar-clinica";
import { iconoEspecie } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "Mis mascotas",
};

export default async function MisMascotasPage() {
  const mascotas = await getMisMascotas();
  const grupos = agruparPorClinica(mascotas);

  return (
    <div>
      <h1 className="mb-4 text-section font-semibold text-text">Mis mascotas</h1>
      {mascotas.length === 0 ? (
        <p className="text-body text-text-muted">Sin mascotas asociadas.</p>
      ) : (
        // Con mascotas en varias clínicas, cada grupo lleva el nombre de la suya.
        grupos.map((g) => (
          <section key={g.tenant_id} className="mb-5">
            {grupos.length > 1 && (
              <h2 className="mb-2 text-body font-semibold text-text-muted">{g.clinica_nombre}</h2>
            )}
            <div className="grid gap-2 tablet:grid-cols-2 tablet:gap-3 desktop:grid-cols-3">
              {g.items.map((m) => (
                <Link
                  key={m.id}
                  href={`/portal/mascotas/${m.id}`}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-3 transition-colors hover:border-accent tablet:p-2.5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-surface-sunken text-xl">
                    {iconoEspecie(m.especie)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{m.nombre}</p>
                    <p className="truncate text-support text-text-muted">
                      {m.raza ?? m.especie} · {m.numero_ficha}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
