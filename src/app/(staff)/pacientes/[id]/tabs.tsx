"use client";

import { useState } from "react";
import Link from "next/link";

import {
  labelTipoConsulta,
  resumenMedicamento,
  type ConsultaConVet,
  type Examen,
  type Receta,
} from "@/lib/types/db";
import { formatearFecha } from "@/lib/utils/format";

import { AnularRecetaButton } from "./consultas/anular-receta-button";
import { ExamenesTab } from "./examenes/examenes-tab";

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
    <div className="rounded-lg border border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="text-xs text-slate-400">{open ? "▾" : "▸"}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {labelTipoConsulta(consulta.tipo)}
        </span>
        <span className="text-sm text-slate-500">
          {formatearFecha(consulta.fecha)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {consulta.diagnostico}
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3 text-sm">
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
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <span>{consulta.veterinario?.nombre ?? "—"}</span>
            <Link
              href={`/pacientes/${pacienteId}/consultas/${consulta.id}`}
              className="font-medium text-teal-700 hover:underline"
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
      <span className="text-slate-400">{label}: </span>
      <span className="whitespace-pre-wrap text-slate-700">{value}</span>
    </p>
  );
}

function RecetaItem({
  receta,
  pacienteId,
}: {
  receta: Receta;
  pacienteId: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-800">
          {receta.numero_receta}
        </span>
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
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
        {receta.medicamentos.map((m, i) => (
          <li key={i}>{resumenMedicamento(m)}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyTab({ label, fase }: { label: string; fase?: number }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
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
}: {
  pacienteId: string;
  notas: string | null;
  consultas: ConsultaConVet[];
  recetas: Receta[];
  examenes: Examen[];
  urlsExamenes: Record<string, string>;
}) {
  const [active, setActive] = useState<TabId>("resumen");

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
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
                      : 0;
              return n > 0 ? (
                <span className="ml-1 text-xs text-slate-400">{n}</span>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      <div className="py-4">
        {active === "resumen" && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-700">
              Observaciones generales
            </h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
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
                <RecetaItem key={r.id} receta={r} pacienteId={pacienteId} />
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
        {active === "vacunas" && <EmptyTab label="Vacunas" fase={6} />}
        {active === "citas" && <EmptyTab label="Citas" fase={6} />}
      </div>
    </div>
  );
}
