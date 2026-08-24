"use client";

import type {
  ClinicaConfig,
  DuenoDePaciente,
  Paciente,
  Receta,
} from "@/lib/types/db";

import { imprimirReceta } from "./imprimir";
import { PrintButton } from "./print-button";

// Wrapper cliente: usable desde componentes servidor (vista de consulta) o
// cliente (tab de recetas). Encapsula el handler de impresión de una receta.
export function ImprimirRecetaButton({
  clinica,
  paciente,
  dueno,
  receta,
  veterinario,
}: {
  clinica: ClinicaConfig | null;
  paciente: Paciente;
  dueno: DuenoDePaciente | null;
  receta: Receta;
  veterinario: string | null;
}) {
  return (
    <PrintButton
      onClick={() =>
        imprimirReceta({ clinica, paciente, dueno, receta, veterinario })
      }
    />
  );
}
