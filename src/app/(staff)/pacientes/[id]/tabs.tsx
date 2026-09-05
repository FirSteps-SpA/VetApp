"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import Link from "next/link";

import { ButtonLink } from "@/components/button";

import {
  colorEstadoCita,
  labelEstadoCita,
  labelTipoConsulta,
  resumenMedicamento,
  type CitaConRel,
  type ClinicaConfig,
  type ConsultaConVet,
  type DuenoDePaciente,
  type EsquemaVacunacion,
  type Examen,
  type Paciente,
  type Receta,
  type Vacuna,
} from "@/lib/types/db";
import { formatearFecha, formatearFechaHora } from "@/lib/utils/format";

import { CitaActions } from "@/app/(staff)/agenda/cita-actions";

import { AnularRecetaButton } from "./consultas/anular-receta-button";
import { ExamenesTab } from "./examenes/examenes-tab";
import { ImprimirRecetaButton } from "./print/imprimir-receta-button";
import { VacunasTab } from "./vacunas/vacunas-tab";

type TabId = "resumen" | "historial" | "recetas" | "examenes" | "vacunas" | "citas";

const TABS: { id: TabId; label: string; fase?: number }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "historial", label: "Historial" },
  { id: "recetas", label: "Recetas" },
  { id: "examenes", label: "Exámenes", fase: 4 },
  { id: "vacunas", label: "Vacunas", fase: 6 },
  { id: "citas", label: "Citas", fase: 6 },
];

function ConsultaItem({
  consulta,
  pacienteId,
}: {
  consulta: ConsultaConVet;
  pacienteId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-control border border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-tap w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="text-xs text-text-muted">{open ? "▾" : "▸"}</span>
        <span className="rounded-pill bg-surface-sunken px-2 py-0.5 text-xs font-medium text-text-muted">
          {labelTipoConsulta(consulta.tipo)}
        </span>
        <span className="text-support text-text-muted">
          {formatearFecha(consulta.fecha)}
        </span>
        <span className="min-w-0 flex-1 truncate text-support font-medium text-text">
          {consulta.diagnostico}
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border px-3 py-3 text-body">
          <Campo label="Motivo" value={consulta.motivo} />
          <Campo label="Anamnesis" value={consulta.anamnesis} />
          <Campo label="Examen físico" value={consulta.examen_fisico} />
          <Campo label="Diagnóstico" value={consulta.diagnostico} />
          <Campo
            label="Diagnóstico diferencial"
            value={consulta.diagnostico_diferencial}
          />
          <Campo label="Tratamiento" value={consulta.tratamiento} />
          <Campo label="Notas" value={consulta.notas} />
          <div className="flex items-center justify-between pt-1 text-xs text-text-muted">
            <span>{consulta.veterinario?.nombre ?? "—"}</span>
            <Link
              href={`/pacientes/${pacienteId}/consultas/${consulta.id}`}
              className="font-medium text-accent hover:underline"
            >
              Ver completo →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null;
  return (
    <p>
      <span className="text-text-muted">{label}: </span>
      <span className="whitespace-pre-wrap text-text">{value}</span>
    </p>
  );
}

function RecetaItem({
  receta,
  pacienteId,
  clinica,
  paciente,
  dueno,
  veterinario,
}: {
  receta: Receta;
  pacienteId: string;
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  veterinario: string | null;
}) {
  return (
    <div className="rounded-control border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Identificación: número arriba, fecha + estado debajo */}
        <div className="min-w-0">
          <div className="text-support font-medium text-text">
            {receta.numero_receta}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-support text-text-muted">
              {formatearFecha(receta.fecha)}
            </span>
            <span
              className={`rounded-pill px-2 py-0.5 text-xs font-medium ${
                receta.vigente
                  ? "bg-accent-subtle text-accent"
                  : "bg-surface-sunken text-text-muted"
              }`}
            >
              {receta.vigente ? "Vigente" : "Anulada"}
            </span>
          </div>
        </div>
        {/* Acciones a la derecha, centradas verticalmente */}
        <div className="flex shrink-0 items-center gap-1">
          <ImprimirRecetaButton
            clinica={clinica}
            paciente={paciente}
            dueno={dueno}
            receta={receta}
            veterinario={veterinario}
          />
          {receta.vigente && (
            <AnularRecetaButton recetaId={receta.id} pacienteId={pacienteId} />
          )}
        </div>
      </div>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-support text-text">
        {receta.medicamentos.map((m, i) => (
          <li key={i}>{resumenMedicamento(m)}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyTab({ label, fase }: { label: string; fase?: number }) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface-raised p-8 text-center text-body text-text-muted">
      {fase ? `${label} — se incorpora en la Fase ${fase}.` : `Sin ${label.toLowerCase()}.`}
    </div>
  );
}

export function FichaTabs({
  pacienteId,
  notas,
  consultas,
  recetas,
  examenes,
  urlsExamenes,
  vacunas,
  esquemas,
  citas,
  clinica,
  paciente,
  dueno,
}: {
  pacienteId: string;
  notas: string | null;
  consultas: ConsultaConVet[];
  recetas: Receta[];
  examenes: Examen[];
  urlsExamenes: Record<string, string>;
  vacunas: Vacuna[];
  esquemas: EsquemaVacunacion[];
  citas: CitaConRel[];
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
}) {
  const [active, setActive] = useState<TabId>("resumen");

  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`inline-flex min-h-tap shrink-0 items-center border-b-2 px-3 text-body font-medium transition-colors ${
              active === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
            {(() => {
              const n =
                tab.id === "historial"
                  ? consultas.length
                  : tab.id === "recetas"
                    ? recetas.length
                    : tab.id === "examenes"
                      ? examenes.length
                      : tab.id === "vacunas"
                        ? vacunas.length
                        : tab.id === "citas"
                          ? citas.length
                          : 0;
              return n > 0 ? (
                <span className="ml-1 text-xs text-text-muted">{n}</span>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      <div className="py-4">
        {active === "resumen" && (
          <div className="space-y-1">
            <h3 className="text-body font-semibold text-text">
              Observaciones generales
            </h3>
            <p className="whitespace-pre-wrap text-body text-text-muted">
              {notas?.trim() || "Sin observaciones registradas."}
            </p>
          </div>
        )}

        {active === "historial" &&
          (consultas.length === 0 ? (
            <EmptyTab label="consultas registradas" />
          ) : (
            <div className="space-y-2">
              {consultas.map((c) => (
                <ConsultaItem key={c.id} consulta={c} pacienteId={pacienteId} />
              ))}
            </div>
          ))}

        {active === "recetas" &&
          (recetas.length === 0 ? (
            <EmptyTab label="recetas emitidas" />
          ) : (
            <div className="space-y-2">
              {recetas.map((r) => (
                <RecetaItem
                  key={r.id}
                  receta={r}
                  pacienteId={pacienteId}
                  clinica={clinica}
                  paciente={paciente}
                  dueno={dueno}
                  veterinario={
                    consultas.find((c) => c.id === r.consulta_id)?.veterinario
                      ?.nombre ?? null
                  }
                />
              ))}
            </div>
          ))}

        {active === "examenes" && (
          <ExamenesTab
            pacienteId={pacienteId}
            examenes={examenes}
            urls={urlsExamenes}
          />
        )}
        {active === "vacunas" && (
          <VacunasTab
            pacienteId={pacienteId}
            vacunas={vacunas}
            esquemas={esquemas}
            clinica={clinica}
            paciente={paciente}
            dueno={dueno}
          />
        )}
        {active === "citas" && (
          <div className="space-y-3">
            <ButtonLink
              href={`/agenda/nueva-cita?paciente=${pacienteId}`}
              size="sm"
            >
              <Icon name="plus" />
              Agendar cita
            </ButtonLink>
            {citas.length === 0 ? (
              <EmptyTab label="citas registradas" />
            ) : (
              <div className="space-y-2">
                {citas.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 rounded-control border border-border p-3"
                  >
                    <span className="text-support text-text-muted">
                      {formatearFechaHora(c.fecha_hora)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-support text-text">
                      {c.motivo}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstadoCita(c.estado)}`}
                    >
                      {labelEstadoCita(c.estado)}
                    </span>
                    <CitaActions
                      citaId={c.id}
                      pacienteId={pacienteId}
                      estado={c.estado}
                      consultaId={c.consulta_id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
