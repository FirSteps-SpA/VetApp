"use client";

import type { ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";

import { RecetaDoc, VacunacionDoc } from "@/lib/pdf/documents";
import type {
  ClinicaConfig,
  DuenoDePaciente,
  Paciente,
  Receta,
  Vacuna,
} from "@/lib/types/db";

// Módulo "pesado": importa @react-pdf. Se alcanza SOLO vía import() dinámico
// (ver imprimir.ts) para que no entre al bundle de la ficha.

// Genera el PDF del documento y abre el diálogo de impresión (papel).
// Primario: iframe oculto + print() (no requiere popup). Fallback: abrir pestaña.
async function abrirParaImprimir(doc: ReactElement): Promise<void> {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(url, "_blank");
      }
    }, 200);
  };

  document.body.appendChild(iframe);

  // Limpieza diferida (deja tiempo a que el diálogo de impresión use el blob).
  setTimeout(() => {
    URL.revokeObjectURL(url);
    iframe.remove();
  }, 60_000);
}

export interface ImprimirRecetaData {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  receta: Receta;
  veterinario?: string | null;
}

export async function imprimirReceta(d: ImprimirRecetaData): Promise<void> {
  await abrirParaImprimir(
    <RecetaDoc
      clinica={d.clinica}
      paciente={d.paciente}
      dueno={d.dueno}
      items={[{ receta: d.receta, veterinario: d.veterinario }]}
    />,
  );
}

export interface ImprimirVacunacionData {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  vacunas: Vacuna[];
}

export async function imprimirVacunacion(
  d: ImprimirVacunacionData,
): Promise<void> {
  await abrirParaImprimir(
    <VacunacionDoc
      clinica={d.clinica}
      paciente={d.paciente}
      dueno={d.dueno}
      vacunas={d.vacunas}
    />,
  );
}
