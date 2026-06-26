import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getConsulta } from "@/lib/data/consultas";
import {
  labelTipoConsulta,
  resumenMedicamento,
  type Receta,
} from "@/lib/types/db";
import { formatearFecha, formatearPeso } from "@/lib/utils/format";

import { AnularRecetaButton } from "../anular-receta-button";

export const metadata: Metadata = {
  title: "Consulta",
};

function Bloque({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </h3>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{value}</p>
    </div>
  );
}

function RecetaBloque({
  receta,
  pacienteId,
}: {
  receta: Receta;
  pacienteId: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-800">{receta.numero_receta}</span>
        <span className="text-sm text-slate-500">
          {formatearFecha(receta.fecha)}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
            receta.vigente
              ? "bg-teal-50 text-teal-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {receta.vigente ? "Vigente" : "Anulada"}
        </span>
        {receta.vigente && (
          <AnularRecetaButton recetaId={receta.id} pacienteId={pacienteId} />
        )}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {receta.medicamentos.map((m, i) => (
          <li key={i} className="border-l-2 border-teal-200 pl-2">
            <span className="font-medium">{m.nombre}</span>
            {m.presentacion ? ` · ${m.presentacion}` : ""}
            <div className="text-slate-500">{resumenMedicamento(m)}</div>
            {m.instrucciones ? (
              <div className="text-slate-500">{m.instrucciones}</div>
            ) : null}
          </li>
        ))}
      </ul>
      {receta.instrucciones_generales && (
        <p className="mt-2 text-sm text-slate-600">
          {receta.instrucciones_generales}
        </p>
      )}
    </div>
  );
}

export default async function ConsultaPage({
  params,
}: {
  params: { id: string; cId: string };
}) {
  const result = await getConsulta(params.cId);
  if (!result || result.consulta.paciente_id !== params.id) notFound();

  const { consulta, recetas } = result;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        href={`/pacientes/${params.id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Ficha del paciente
      </Link>

      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {labelTipoConsulta(consulta.tipo)}
        </h1>
        <span className="text-sm text-slate-500">
          {formatearFecha(consulta.fecha)}
        </span>
        <span className="text-sm text-slate-400">
          · {consulta.veterinario?.nombre ?? "—"}
        </span>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <Bloque label="Motivo" value={consulta.motivo} />
        <Bloque label="Anamnesis" value={consulta.anamnesis} />
        <Bloque label="Examen físico" value={consulta.examen_fisico} />
        <div className="flex gap-6">
          {consulta.peso_kg != null && (
            <Bloque label="Peso" value={formatearPeso(consulta.peso_kg)} />
          )}
          {consulta.temperatura_c != null && (
            <Bloque label="Temperatura" value={`${consulta.temperatura_c} °C`} />
          )}
        </div>
        <Bloque label="Diagnóstico" value={consulta.diagnostico} />
        <Bloque
          label="Diagnóstico diferencial"
          value={consulta.diagnostico_diferencial}
        />
        <Bloque label="Tratamiento" value={consulta.tratamiento} />
        <Bloque label="Notas" value={consulta.notas} />
      </section>

      {recetas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Recetas</h2>
          {recetas.map((r) => (
            <RecetaBloque key={r.id} receta={r} pacienteId={params.id} />
          ))}
        </section>
      )}
    </div>
  );
}
