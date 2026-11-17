import type { Metadata } from "next";

import { getAvisosPorId, getMisAceptaciones } from "@/lib/data/privacidad";
import { getMisDuenos } from "@/lib/data/portal";
import { formatearFechaHora } from "@/lib/utils/format";

import { AceptarAvisoButton, DescargarMisDatos } from "./privacidad-ui";

export const metadata: Metadata = {
  title: "Privacidad",
};

// Centro de privacidad del dueño: el aviso de cada clínica (para aceptar, o el
// ya aceptado con su fecha) y la descarga de sus datos.
export default async function PrivacidadPortalPage() {
  const [duenos, aceptaciones] = await Promise.all([getMisDuenos(), getMisAceptaciones()]);
  const avisos = await getAvisosPorId(
    duenos.map((d) => d.aviso_vigente_id).filter((x): x is string => !!x),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-section font-semibold text-text">Privacidad</h1>
      {duenos.map((d) => {
        const aviso = avisos.find((a) => a.id === d.aviso_vigente_id) ?? null;
        const aceptado = aceptaciones.find((a) => a.dueno_id === d.id && a.aviso_id === d.aviso_vigente_id);
        return (
          <section key={d.id} className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-1 font-semibold text-text">{d.clinica_nombre}</h2>
            {!aviso ? (
              <p className="text-sm text-text-muted">
                Esta clínica aún no publica su aviso de privacidad. Verás tus datos de ella cuando
                lo publique y lo aceptes.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-text-muted">
                  Aviso de privacidad, versión {aviso.version}
                  {aceptado ? ` · aceptado el ${formatearFechaHora(aceptado.aceptado_en)}` : ""}
                </p>
                <div className="mb-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface-sunken p-3 text-sm text-text">
                  {aviso.texto}
                </div>
                {d.aviso_pendiente ? (
                  <AceptarAvisoButton avisoId={aviso.id} />
                ) : (
                  <DescargarMisDatos tenantId={d.tenant_id} clinica={d.clinica_nombre} />
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
