import Link from "next/link";
import { Icon } from "@/components/icon";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getCitasPaciente } from "@/lib/data/citas";
import { getClinicaConfig } from "@/lib/data/clinica";
import { getConsultas, getRecetas } from "@/lib/data/consultas";
import { getDocumentosEmitidos } from "@/lib/data/documentos";
import { getExamenes, getUrlsExamenes } from "@/lib/data/examenes";
import { getEsquemasVacunacion, getVacunas } from "@/lib/data/vacunas";
import {
  getDuenosDePaciente,
  getFotoSignedUrl,
  getPaciente,
  getResumenClinico,
} from "@/lib/data/pacientes";
import { getMiPerfil, getVeterinarios } from "@/lib/data/usuarios";
import { labelEspecie, resumenMedicamento, SEXOS } from "@/lib/types/db";
import { calcularEdad, formatearFecha, formatearPeso } from "@/lib/utils/format";

import { NuevaConsultaDrawer } from "./consultas/nueva-consulta-drawer";
import { DocumentosButton } from "./documentos/documentos-button";
import { ExportButton } from "./export/export-button";
import { ResumenLateral } from "./resumen-lateral";
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
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm text-text">{value}</dd>
    </div>
  );
}

export default async function FichaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { cita?: string };
}) {
  const paciente = await getPaciente(params.id);
  if (!paciente) notFound();

  const [
    duenos,
    resumen,
    fotoUrl,
    consultas,
    recetas,
    examenes,
    vacunas,
    clinica,
    citas,
    emitidos,
    emisor,
    veterinarios,
  ] = await Promise.all([
      getDuenosDePaciente(paciente.id),
      getResumenClinico(paciente.id),
      getFotoSignedUrl(paciente.foto_url),
      getConsultas(paciente.id),
      getRecetas(paciente.id),
      getExamenes(paciente.id),
      getVacunas(paciente.id),
      getClinicaConfig(),
      getCitasPaciente(paciente.id),
      getDocumentosEmitidos(paciente.id),
      getMiPerfil(),
      getVeterinarios(),
    ]);
  const [urlsExamenes, esquemas] = await Promise.all([
    getUrlsExamenes(examenes),
    getEsquemasVacunacion(paciente.especie),
  ]);

  const principal = duenos.find((d) => d.es_principal) ?? duenos[0] ?? null;
  const edad = calcularEdad(paciente.fecha_nacimiento);
  const sexoLabel =
    SEXOS.find((s) => s.value === paciente.sexo)?.label ?? "—";

  const vacunaChip =
    resumen.vacunasVencidas > 0
      ? {
          text: `${resumen.vacunasVencidas} vencida(s)`,
          class: "bg-danger-subtle text-text",
        }
      : resumen.vacunasProximas > 0
        ? {
            text: `${resumen.vacunasProximas} próxima(s)`,
            class: "bg-warning-subtle text-text",
          }
        : { text: "Sin alertas", class: "bg-surface-sunken text-text-muted" };

  // Editar / Exportar: se muestran apilados en el hero card (a la derecha de la
  // foto en móvil, del encabezado en desktop). Se define una vez y se coloca en
  // ambos slots; sólo uno es visible por breakpoint.
  const accionBtn =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-sunken";
  const acciones = (
    <>
      <Link href={`/pacientes/${paciente.id}/editar`} className={accionBtn}>
        <Icon name="pencil" />
        Editar
      </Link>
      <ExportButton
        className={accionBtn}
        data={{
          pacienteId: paciente.id,
          clinica,
          paciente,
          dueno: principal,
          consultas,
          recetas,
          examenes,
          vacunas,
        }}
      />
      <DocumentosButton
        className={accionBtn}
        data={{
          pacienteId: paciente.id,
          clinica,
          paciente,
          dueno: principal,
          emitidos,
          emisor: emisor
            ? {
                id: emisor.id,
                nombre: emisor.nombre,
                rut: emisor.rut,
                titulo_profesional: emisor.titulo_profesional,
              }
            : null,
          veterinarios,
        }}
      />
    </>
  );

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
          className="text-sm text-text-muted hover:text-text"
        >
          ← Pacientes
        </Link>
        <NuevaConsultaDrawer
          pacienteId={paciente.id}
          citaId={searchParams.cita}
          autoOpen={!!searchParams.cita}
        />
      </div>

      <div className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_20rem] desktop:items-start">
      <div className="flex flex-col gap-5">
      {/* Hero card */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start justify-between gap-4 sm:block sm:shrink-0">
            <PhotoUploader
              pacienteId={paciente.id}
              especie={paciente.especie}
              initialUrl={fotoUrl}
            />
            {/* Acciones a la derecha de la foto (sólo móvil) */}
            <div className="flex w-32 flex-col gap-2 sm:hidden">{acciones}</div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-text">
                {paciente.nombre}
              </h1>
              <span className="rounded-pill bg-surface-sunken px-2 py-0.5 text-xs font-medium text-text-muted">
                {paciente.numero_ficha}
              </span>
                {!paciente.activo && (
                  <span className="rounded-pill bg-border px-2 py-0.5 text-xs font-medium text-text-muted">
                    Archivado
                  </span>
                )}
              </div>
              {/* Acciones a la derecha del encabezado (sólo desktop) */}
              <div className="hidden w-32 flex-col gap-2 sm:flex">{acciones}</div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Dato
                label="Especie / Raza"
                value={`${labelEspecie(paciente.especie)}${
                  paciente.raza ? ` · ${paciente.raza}` : ""
                }`}
              />
              <Dato label="RUT" value={paciente.rut ?? "—"} />
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
        <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-muted">
                {duenos.length > 1 ? "Dueños" : "Dueño principal"}
              </p>
              <Link
                href={`/pacientes/${paciente.id}/duenos`}
                className="text-xs font-medium text-accent hover:underline"
              >
                Gestionar{duenos.length > 1 ? ` (${duenos.length})` : ""}
              </Link>
            </div>
            {principal ? (
              <>
                <p className="text-sm font-medium text-text">
                  {principal.nombre}
                  {principal.rut ? (
                    <span className="ml-1 text-xs font-normal text-text-muted">
                      · {principal.rut}
                    </span>
                  ) : null}
                </p>
                <a
                  href={`tel:${principal.telefono}`}
                  className="text-sm text-accent hover:underline"
                >
                  {principal.telefono}
                </a>
              </>
            ) : (
              <p className="text-sm text-text-muted">—</p>
            )}
          </div>

          <div>
            <p className="text-xs text-text-muted">Última consulta</p>
            {resumen.ultimaConsulta ? (
              <p className="text-sm text-text">
                {formatearFecha(resumen.ultimaConsulta.fecha)} ·{" "}
                {resumen.ultimaConsulta.diagnostico}
              </p>
            ) : (
              <p className="text-sm text-text-muted">Sin consultas</p>
            )}
          </div>

          <div>
            <p className="text-xs text-text-muted">Estado vacunal</p>
            <span
              className={`mt-0.5 inline-block rounded-pill px-2 py-0.5 text-xs font-medium ${vacunaChip.class}`}
            >
              {vacunaChip.text}
            </span>
          </div>
        </div>

        {/* Medicamentos activos (última receta vigente) */}
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-text-muted">Medicamentos activos</p>
          {resumen.medicamentosActivos.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {resumen.medicamentosActivos.map((m, i) => (
                <li
                  key={i}
                  className="rounded-pill bg-accent-subtle px-2 py-0.5 text-xs text-accent"
                >
                  {resumenMedicamento(m)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Sin medicamentos vigentes</p>
          )}
        </div>
      </section>

      <section
        id="historial"
        className="rounded-card border border-border bg-surface px-5 py-2"
      >
        <FichaTabs
          pacienteId={paciente.id}
          notas={paciente.notas}
          consultas={consultas}
          recetas={recetas}
          examenes={examenes}
          urlsExamenes={urlsExamenes}
          vacunas={vacunas}
          esquemas={esquemas}
          citas={citas}
          clinica={clinica}
          paciente={paciente}
          dueno={principal}
        />
      </section>
      </div>

      <ResumenLateral
        consultas={consultas}
        vacunas={vacunas}
        pacienteId={paciente.id}
      />
      </div>
    </div>
  );
}
