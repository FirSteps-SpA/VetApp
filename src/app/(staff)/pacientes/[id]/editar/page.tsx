import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPaciente } from "@/lib/data/pacientes";

import { EditForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Editar paciente",
};

export default async function EditarPacientePage({
  params,
}: {
  params: { id: string };
}) {
  const paciente = await getPaciente(params.id);
  if (!paciente) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/pacientes/${paciente.id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← {paciente.nombre}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-slate-900">
        Editar paciente
      </h1>
      <EditForm paciente={paciente} />
    </div>
  );
}
