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
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← {paciente.nombre}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-slate-900">
        Dueños de {paciente.nombre}
      </h1>
      <ManageDuenos pacienteId={params.id} duenos={duenos} />
    </div>
  );
}
