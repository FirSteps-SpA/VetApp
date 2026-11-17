import Link from "next/link";
import type { Metadata } from "next";

import { getClinicaConfigRaw } from "@/lib/data/clinica";
import { getAvisosClinica } from "@/lib/data/privacidad";
import { plantillaAviso } from "@/lib/privacidad/plantilla";
import { formatearFechaHora } from "@/lib/utils/format";

import { EditorAviso } from "./editor-aviso";

export const metadata: Metadata = {
  title: "Privacidad",
};

// Aviso de privacidad de la clínica activa (solo la cuenta de plataforma).
export default async function PrivacidadPage() {
  const [clinica, avisos] = await Promise.all([getClinicaConfigRaw(), getAvisosClinica()]);
  if (!clinica) return <p className="text-text-muted">No hay una clínica activa.</p>;
  const vigente = avisos[0] ?? null;

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-text-muted hover:text-text">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-text">Aviso de privacidad</h1>
      <p className="mb-4 text-sm text-text-muted">
        {clinica.nombre_clinica} ·{" "}
        {vigente
          ? `versión ${vigente.version} vigente desde ${formatearFechaHora(vigente.publicado_en)}`
          : "sin aviso publicado: no se puede invitar dueños al portal"}
      </p>
      <p className="mb-6 rounded-control bg-warning-subtle px-3 py-2 text-sm text-text">
        La plantilla es un punto de partida: revisa el texto con la asesoría legal de la clínica
        antes de publicarlo. Cada publicación crea una versión nueva y obliga a los dueños a
        aceptarla otra vez al entrar al portal.
      </p>

      <EditorAviso inicial={vigente?.texto ?? plantillaAviso(clinica)} hayVigente={!!vigente} />

      {avisos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-text">Versiones publicadas</h2>
          <ul className="divide-y divide-border rounded-card border border-border bg-surface">
            {avisos.map((a) => (
              <li key={a.id}>
                <details className="p-3">
                  <summary className="cursor-pointer text-sm text-text">
                    Versión {a.version} · {formatearFechaHora(a.publicado_en)}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">{a.texto}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
