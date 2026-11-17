"use client";

// Dispatchers "livianos": el import() dinámico de print-doc (y con él react-pdf)
// solo ocurre al llamar la función, no al cargar la ficha. Los tipos se importan
// como type (se borran en compilación, no arrastran react-pdf).
import type {
  ImprimirRecetaData,
  ImprimirVacunacionData,
} from "./print-doc";

import { registrarExportacion } from "../registro-actions";

// Registro de accesos (spec 7) antes de imprimir: sin registro no se imprime.
async function registrar(
  ...args: Parameters<typeof registrarExportacion>
): Promise<boolean> {
  const r = await registrarExportacion(...args);
  if (!r.ok) window.alert("No se pudo registrar la impresión. Intenta de nuevo.");
  return r.ok;
}

export async function imprimirReceta(d: ImprimirRecetaData): Promise<void> {
  if (!(await registrar(d.paciente.id, "receta", { recetas: [d.receta.numero_receta] }))) return;
  const m = await import("./print-doc");
  return m.imprimirReceta(d);
}

export async function imprimirVacunacion(
  d: ImprimirVacunacionData,
): Promise<void> {
  if (!(await registrar(d.paciente.id, "vacunacion"))) return;
  const m = await import("./print-doc");
  return m.imprimirVacunacion(d);
}
