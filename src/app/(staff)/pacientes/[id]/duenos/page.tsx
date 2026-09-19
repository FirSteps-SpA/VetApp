import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getDuenosDePaciente, getPaciente } from "@/lib/data/pacientes";

import { ManageDuenos } from "./manage-duenos";

export const metadata: Metadata = {
  title: "Dueños",
};

export default async function DuenosPage({
  params,
}: {
  params: { id: string };
}) {
  const [paciente, duenos] = await Promise.all([
    getPaciente(params.id),
    getDuenosDePaciente(params.id),
  ]);
  if (!paciente) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/pacientes/${params.id}`}
        className="text-sm text-text-muted hover:text-text"
      >
        ← {paciente.nombre}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-text">
        Dueños de {paciente.nombre}
      </h1>
      <ManageDuenos pacienteId={params.id} duenos={duenos} />
    </div>
  );
}
