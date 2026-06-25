import Link from "next/link";
import type { Metadata } from "next";

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
        <h1 className="text-2xl font-semibold text-slate-900">Pacientes</h1>
        <Link
          href="/pacientes/nuevo"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          + Nuevo
        </Link>
      </div>

      <SearchBar initial={q} />

      {!buscando && <Recientes />}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {buscando ? `Resultados (${pacientes.length})` : "Todos los pacientes"}
        </h2>

        {pacientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {buscando
              ? "Sin coincidencias para tu búsqueda."
              : "Aún no hay pacientes registrados."}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {pacientes.map((p) => (
              <PacienteCard key={p.id} paciente={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
