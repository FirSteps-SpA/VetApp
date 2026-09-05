import { Icon } from "@/components/icon";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/button";
import { buscarPacientes } from "@/lib/data/pacientes";

import { PacienteCard } from "./paciente-card";
import { Recientes } from "./recientes";
import { SearchBar } from "./search-bar";

export const metadata: Metadata = {
  title: "Pacientes",
};

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const pacientes = await buscarPacientes(q);
  const buscando = q.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-page font-semibold text-text">Pacientes</h1>
        <ButtonLink href="/pacientes/nuevo" size="sm">
          <Icon name="plus" />
          Nuevo
        </ButtonLink>
      </div>

      <SearchBar initial={q} />

      {!buscando && <Recientes />}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {buscando ? `Resultados (${pacientes.length})` : "Todos los pacientes"}
        </h2>

        {pacientes.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-raised p-8 text-center text-body text-text-muted">
            {buscando
              ? "Sin coincidencias para tu búsqueda."
              : "Aún no hay pacientes registrados."}
          </div>
        ) : (
          <div className="grid gap-2 tablet:grid-cols-2 tablet:gap-3 desktop:grid-cols-3">
            {pacientes.map((p) => (
              <PacienteCard key={p.id} paciente={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
