import Link from "next/link";
import type { Metadata } from "next";

import { getClinicaConfigRaw, getClinicas } from "@/lib/data/clinica";

import { ClinicaActivaToggle, CrearClinicaForm, UsarClinicaButton } from "./clinicas-ui";

export const metadata: Metadata = {
  title: "Clínicas",
};

// Clínicas de la plataforma (solo dev): alta, desactivación y clínica activa.
export default async function ClinicasPage() {
  const [clinicas, activa] = await Promise.all([getClinicas(), getClinicaConfigRaw()]);

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-text-muted hover:text-text">
        ← Administración
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold text-text">Clínicas</h1>
      <p className="mb-6 text-sm text-text-muted">
        Cada clínica opera aislada, con su entrada en <code>/c/&lt;slug&gt;/login</code>. Para
        administrar sus usuarios y su configuración, úsala como clínica activa.
      </p>

      <ul className="mb-8 divide-y divide-border rounded-card border border-border bg-surface">
        {clinicas.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text">
                {c.nombre_clinica}
                {activa?.id === c.id && (
                  <span className="ml-2 rounded-pill bg-accent-subtle px-2 py-0.5 text-xs text-accent">
                    Activa
                  </span>
                )}
                {!c.activo && (
                  <span className="ml-2 rounded-pill bg-surface-sunken px-2 py-0.5 text-xs text-text-muted">
                    Desactivada
                  </span>
                )}
              </p>
              <p className="text-sm text-text-muted">/c/{c.slug}/login</p>
            </div>
            {c.activo && activa?.id !== c.id && <UsarClinicaButton id={c.id} />}
            {activa?.id !== c.id && <ClinicaActivaToggle id={c.id} activo={c.activo} />}
          </li>
        ))}
      </ul>

      <h2 className="mb-3 text-lg font-semibold text-text">Nueva clínica</h2>
      <CrearClinicaForm />
    </div>
  );
}
