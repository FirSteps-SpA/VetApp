import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getConsultas, getRecetas } from "@/lib/data/consultas";
import { getExamenes, getUrlsExamenes } from "@/lib/data/examenes";
import {
  getDuenosDePaciente,
  getFotoSignedUrl,
  getPaciente,
  getResumenClinico,
} from "@/lib/data/pacientes";
import { labelEspecie, resumenMedicamento, SEXOS } from "@/lib/types/db";
import { calcularEdad, formatearFecha, formatearPeso } from "@/lib/utils/format";

import { NuevaConsultaDrawer } from "./consultas/nueva-consulta-drawer";
import { FichaTabs } from "./tabs";
import { PhotoUploader } from "./photo-uploader";
import { RecordVisit } from "./record-visit";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const paciente = await getPaciente(params.id);
  return { title: paciente?.nombre ?? "Paciente" };
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export default async function FichaPage({
  params,
}: {
  params: { id: string };
}) {
  const paciente = await getPaciente(params.id);
  if (!paciente) notFound();

  const [duenos, resumen, fotoUrl, consultas, recetas, examenes] =
    await Promise.all([
      getDuenosDePaciente(paciente.id),
      getResumenClinico(paciente.id),
      getFotoSignedUrl(paciente.foto_url),
      getConsultas(paciente.id),
      getRecetas(paciente.id),
      getExamenes(paciente.id),
    ]);
  const urlsExamenes = await getUrlsExamenes(examenes);

  const principal = duenos.find((d) => d.es_principal) ?? duenos[0] ?? null;
  const edad = calcularEdad(paciente.fecha_nacimiento);
  const sexoLabel =
    SEXOS.find((s) => s.value === paciente.sexo)?.label ?? "—";

  const vacunaChip =
    resumen.vacunasVencidas > 0
      ? {
          text: `${resumen.vacunasVencidas} vencida(s)`,
          class: "bg-red-50 text-red-700",
        }
      : resumen.vacunasProximas > 0
        ? {
            text: `${resumen.vacunasProximas} próxima(s)`,
            class: "bg-amber-50 text-amber-700",
          }
        : { text: "Sin alertas", class: "bg-slate-100 text-slate-500" };

  return (
    <div className="flex flex-col gap-5">
      <RecordVisit
        paciente={{
          id: paciente.id,
          nombre: paciente.nombre,
          especie: paciente.especie,
          numero_ficha: paciente.numero_ficha,
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/pacientes"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Pacientes
        </Link>
        <NuevaConsultaDrawer pacienteId={paciente.id} />
      </div>

      {/* Hero card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          <PhotoUploader
            pacienteId={paciente.id}
            especie={paciente.especie}
            initialUrl={fotoUrl}
          />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                {paciente.nombre}
              </h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {paciente.numero_ficha}
              </span>
              {!paciente.activo && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Archivado
                </span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Dato
                label="Especie / Raza"
                value={`${labelEspecie(paciente.especie)}${
                  paciente.raza ? ` · ${paciente.raza}` : ""
                }`}
              />
              <Dato label="Edad" value={edad ?? "—"} />
              <Dato label="Peso" value={formatearPeso(paciente.peso_kg)} />
              <Dato label="Sexo" value={sexoLabel} />
              <Dato
                label="Castrado"
                value={paciente.castrado ? "Sí" : "No"}
              />
              <Dato
                label="Nacimiento"
                value={formatearFecha(paciente.fecha_nacimiento)}
              />
            </dl>
          </div>
        </div>

        {/* Dueño principal + resumen clínico */}
        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Dueño principal</p>
            {principal ? (
              <>
                <p className="text-sm font-medium text-slate-800">
                  {principal.nombre}
                </p>
                <a
                  href={`tel:${principal.telefono}`}
                  className="text-sm text-teal-700 hover:underline"
                >
                  {principal.telefono}
                </a>
              </>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-400">Última consulta</p>
            {resumen.ultimaConsulta ? (
              <p className="text-sm text-slate-800">
                {formatearFecha(resumen.ultimaConsulta.fecha)} ·{" "}
                {resumen.ultimaConsulta.diagnostico}
              </p>
            ) : (
              <p className="text-sm text-slate-500">Sin consultas</p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-400">Estado vacunal</p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${vacunaChip.class}`}
            >
              {vacunaChip.text}
            </span>
          </div>
        </div>

        {/* Medicamentos activos (última receta vigente) */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">Medicamentos activos</p>
          {resumen.medicamentosActivos.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {resumen.medicamentosActivos.map((m, i) => (
                <li
                  key={i}
                  className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                >
                  {resumenMedicamento(m)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sin medicamentos vigentes</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-2">
        <FichaTabs
          pacienteId={paciente.id}
          notas={paciente.notas}
          consultas={consultas}
          recetas={recetas}
          examenes={examenes}
          urlsExamenes={urlsExamenes}
        />
      </section>
    </div>
  );
}
