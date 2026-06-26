import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getDueno } from "@/lib/data/duenos";

import { EditDuenoForm } from "./edit-dueno-form";

export const metadata: Metadata = {
  title: "Editar dueño",
};

export default async function EditarDuenoPage({
  params,
}: {
  params: { id: string; duenoId: string };
}) {
  const dueno = await getDueno(params.duenoId);
  if (!dueno) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/pacientes/${params.id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Ficha del paciente
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-slate-900">
        Editar dueño
      </h1>
      <EditDuenoForm dueno={dueno} pacienteId={params.id} />
    </div>
  );
}
