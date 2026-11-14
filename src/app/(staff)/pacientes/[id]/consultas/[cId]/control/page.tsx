import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getConsulta } from "@/lib/data/consultas";
import { getMiPerfil, getVeterinarios } from "@/lib/data/usuarios";
import { formatearFecha } from "@/lib/utils/format";

import { ControlForm } from "./control-form";

export const metadata: Metadata = {
  title: "Registrar control",
};

export default async function RegistrarControlPage({
  params,
}: {
  params: { id: string; cId: string };
}) {
  const [result, veterinarios, perfil] = await Promise.all([
    getConsulta(params.cId),
    getVeterinarios(),
    getMiPerfil(),
  ]);
  if (!result || result.consulta.paciente_id !== params.id) notFound();

  // Los controles no se anidan: desde un control se registra sobre su origen.
  const origenId = result.consulta.consulta_origen_id;
  const origen = origenId ? (await getConsulta(origenId))?.consulta : result.consulta;
  if (!origen) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/pacientes/${params.id}/consultas/${origen.id}`}
        className="text-sm text-text-muted hover:text-text"
      >
        ← Consulta
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-text">
        Registrar control
      </h1>
      <p className="mb-6 text-sm text-text-muted">
        Control de la consulta del {formatearFecha(origen.fecha)} · {origen.diagnostico}
      </p>
      <ControlForm
        pacienteId={params.id}
        origen={origen}
        veterinarios={veterinarios}
        usuarioId={perfil?.id ?? null}
      />
    </div>
  );
}
