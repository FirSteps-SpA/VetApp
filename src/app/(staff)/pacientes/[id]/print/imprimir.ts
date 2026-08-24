"use client";

// Dispatchers "livianos": el import() dinámico de print-doc (y con él react-pdf)
// solo ocurre al llamar la función, no al cargar la ficha. Los tipos se importan
// como type (se borran en compilación, no arrastran react-pdf).
import type {
  ImprimirRecetaData,
  ImprimirVacunacionData,
} from "./print-doc";

export async function imprimirReceta(d: ImprimirRecetaData): Promise<void> {
  const m = await import("./print-doc");
  return m.imprimirReceta(d);
}

export async function imprimirVacunacion(
  d: ImprimirVacunacionData,
): Promise<void> {
  const m = await import("./print-doc");
  return m.imprimirVacunacion(d);
}
