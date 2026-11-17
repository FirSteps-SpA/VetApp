"use client";

import type { ClinicaConfig } from "@/lib/types/db";

import type { PaqueteDatos } from "./paquete";

// Liviano: @react-pdf y los documentos se cargan con import() solo al
// descargar el PDF, como en ../../app/(staff)/pacientes/[id]/print/imprimir.ts.

function bajar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

// Descarga el paquete de datos del dueño en sus dos formatos: PDF legible y
// JSON estructurado (portabilidad). Lo usan el portal y la ficha del dueño.
export async function descargarPaquete(
  paquete: PaqueteDatos,
  clinica: ClinicaConfig | null,
  formato: "pdf" | "json",
) {
  const base = `datos_${paquete.dueno.nombre.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_")}_${paquete.generado_en.slice(0, 10)}`;
  if (formato === "json") {
    bajar(new Blob([JSON.stringify(paquete, null, 2)], { type: "application/json" }), `${base}.json`);
    return;
  }
  const [{ pdf }, { DatosDuenoDoc }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/documents"),
  ]);
  bajar(await pdf(<DatosDuenoDoc clinica={clinica} paquete={paquete} />).toBlob(), `${base}.pdf`);
}
