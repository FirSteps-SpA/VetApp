import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getClinicaConfig } from "@/lib/data/clinica";
import { getMascotaPortal } from "@/lib/data/portal";
import {
  iconoEspecie,
  labelEspecie,
  labelTipoConsulta,
} from "@/lib/types/db";
import { calcularEdad, formatearFecha, formatearPeso } from "@/lib/utils/format";

import { DownloadsLoader } from "./downloads-loader";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const ficha = await getMascotaPortal(params.id);
  return { title: ficha?.paciente.nombre ?? "Mascota" };
}

export default async function MascotaPortalPage({
  params,
}: {
  params: { id: string };
}) {
  const [ficha, clinica] = await Promise.all([
    getMascotaPortal(params.id),
    getClinicaConfig(),
  ]);
  if (!ficha) notFound();

  const { paciente, dueno, fotoUrl, consultas, examenes, recetas, vacunas } =
    ficha;
  const edad = calcularEdad(paciente.fecha_nacimiento);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/portal" className="text-sm text-text-muted hover:text-text">
        ← Portal
      </Link>

      {/* Bio */}
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-pill bg-surface-sunken text-4xl">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt={paciente.nombre} className="h-full w-full object-cover" />
          ) : (
            <span>{iconoEspecie(paciente.especie)}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-text">
            {paciente.nombre}
          </h1>
          <p className="text-sm text-text-muted">
            {labelEspecie(paciente.especie)}
            {paciente.raza ? ` · ${paciente.raza}` : ""} · {paciente.numero_ficha}
          </p>
          <p className="text-sm text-text-muted">
            {edad ? `${edad} · ` : ""}
            {formatearPeso(paciente.peso_kg)}
          </p>
        </div>
      </section>

      {/* Descargas (recetas + historial) */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <DownloadsLoader
          data={{ clinica, mascota: paciente, dueno, consultas, recetas, examenes, vacunas }}
        />
      </section>

      {/* Consultas */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-text">Consultas</h2>
        {consultas.length === 0 ? (
          <p className="text-sm text-text-muted">Sin consultas registradas.</p>
        ) : (
          <div className="space-y-2">
            {consultas.map((c) => (
              <div key={c.id} className="rounded-control border border-border p-3">
                <p className="text-sm font-medium text-text">
                  {formatearFecha(c.fecha)} · {labelTipoConsulta(c.tipo)}
                </p>
                <p className="text-sm text-text-muted">Diagnóstico: {c.diagnostico}</p>
                <p className="text-sm text-text-muted">
                  Tratamiento: {c.tratamiento}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Exámenes */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-text">Exámenes</h2>
        {examenes.length === 0 ? (
          <p className="text-sm text-text-muted">Sin exámenes disponibles.</p>
        ) : (
          <div className="space-y-2">
            {examenes.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2 rounded-control border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {e.nombre}
                  </p>
                  <p className="text-xs text-text-muted">
                    {e.tipo} · {formatearFecha(e.fecha)}
                  </p>
                </div>
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vacunas */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-text">Vacunas</h2>
        {vacunas.length === 0 ? (
          <p className="text-sm text-text-muted">Sin vacunas registradas.</p>
        ) : (
          <div className="space-y-1">
            {vacunas.map((v) => (
              <p key={v.id} className="text-sm text-text">
                {formatearFecha(v.fecha_aplicacion)} · {v.nombre_vacuna}
                {v.proxima_dosis
                  ? ` · próxima: ${formatearFecha(v.proxima_dosis)}`
                  : ""}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
