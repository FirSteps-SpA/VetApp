import Link from "next/link";
import type { Metadata } from "next";

import { getPaciente } from "@/lib/data/pacientes";

import { NuevaCitaForm } from "./nueva-cita-form";

export const metadata: Metadata = {
  title: "Nueva cita",
};

export default async function NuevaCitaPage({
  searchParams,
}: {
  searchParams: { paciente?: string; fecha?: string };
}) {
  const prePaciente = searchParams.paciente
    ? await getPaciente(searchParams.paciente)
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/agenda" className="text-sm text-text-muted hover:text-text">
        ← Agenda
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-text">
        Nueva cita
      </h1>
      <NuevaCitaForm
        preseleccionado={
          prePaciente ? { id: prePaciente.id, nombre: prePaciente.nombre } : null
        }
        fechaInicial={searchParams.fecha ?? ""}
      />
    </div>
  );
}
