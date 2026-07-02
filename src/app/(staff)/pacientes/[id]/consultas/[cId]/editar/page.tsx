import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getConsulta } from "@/lib/data/consultas";

import { EditConsultaForm } from "./edit-consulta-form";

export const metadata: Metadata = {
  title: "Editar consulta",
};

export default async function EditarConsultaPage({
  params,
}: {
  params: { id: string; cId: string };
}) {
  const result = await getConsulta(params.cId);
  if (!result || result.consulta.paciente_id !== params.id) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/pacientes/${params.id}/consultas/${params.cId}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Consulta
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-slate-900">
        Editar consulta
      </h1>
      <EditConsultaForm pacienteId={params.id} consulta={result.consulta} />
    </div>
  );
}
