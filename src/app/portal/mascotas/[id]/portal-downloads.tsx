"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";

import {
  HistorialClienteDoc,
  RecetaClienteDoc,
} from "@/lib/pdf/documents";
import type {
  ConsultaPortal,
  ExamenPortal,
  MascotaPortal,
  RecetaPortal,
  VacunaPortal,
} from "@/lib/data/portal";
import { resumenMedicamento, type ClinicaConfig, type Dueno } from "@/lib/types/db";
import { formatearFecha } from "@/lib/utils/format";

export interface PortalDownloadsData {
  clinica: ClinicaConfig | null;
  mascota: MascotaPortal;
  dueno: Dueno | null;
  consultas: ConsultaPortal[];
  recetas: RecetaPortal[];
  examenes: ExamenPortal[];
  vacunas: VacunaPortal[];
}

async function descargar(doc: React.ReactElement, filename: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PortalDownloads({
  data,
}: {
  data: PortalDownloadsData;
}) {
  const { clinica, mascota, dueno, consultas, recetas, examenes, vacunas } = data;
  const [busy, setBusy] = useState(false);

  async function historial() {
    setBusy(true);
    await descargar(
      <HistorialClienteDoc
        clinica={clinica}
        mascota={mascota}
        dueno={dueno}
        consultas={consultas}
        recetas={recetas}
        examenes={examenes}
        vacunas={vacunas}
      />,
      `${mascota.numero_ficha}_historial.pdf`,
    );
    setBusy(false);
  }

  async function receta(r: RecetaPortal) {
    setBusy(true);
    await descargar(
      <RecetaClienteDoc
        clinica={clinica}
        mascota={mascota}
        dueno={dueno}
        receta={r}
      />,
      `${r.numero_receta}.pdf`,
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={historial}
        disabled={busy}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {busy ? "Generando…" : "Descargar historial (PDF)"}
      </button>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Recetas vigentes
        </h2>
        {recetas.length === 0 ? (
          <p className="text-sm text-slate-500">Sin recetas vigentes.</p>
        ) : (
          <div className="space-y-2">
            {recetas.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {r.numero_receta}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatearFecha(r.fecha)}
                  </span>
                  <button
                    type="button"
                    onClick={() => receta(r)}
                    disabled={busy}
                    className="ml-auto text-xs font-medium text-teal-700 hover:underline disabled:opacity-60"
                  >
                    Descargar PDF
                  </button>
                </div>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                  {r.medicamentos.map((m, i) => (
                    <li key={i}>{resumenMedicamento(m)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
