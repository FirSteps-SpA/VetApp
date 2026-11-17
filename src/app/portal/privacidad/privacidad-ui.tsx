"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { descargarPaquete } from "@/lib/privacidad/descargar";

import { aceptarAviso, obtenerMisDatos } from "./actions";

const boton =
  "rounded-control border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-sunken disabled:opacity-60";

export function AceptarAvisoButton({ avisoId }: { avisoId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await aceptarAviso(avisoId);
            if (r.error) setError(r.error);
            else router.refresh();
          })
        }
        className="self-start rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Registrando…" : "He leído y acepto el aviso de privacidad"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function DescargarMisDatos({ tenantId, clinica }: { tenantId: string; clinica: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bajar = (formato: "pdf" | "json") =>
    start(async () => {
      setError(null);
      const r = await obtenerMisDatos(tenantId);
      if (!r.ok) setError(r.error);
      else await descargarPaquete(r.paquete, r.clinica, formato);
    });
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-muted">Descarga los datos que {clinica} tiene sobre ti y tus mascotas.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => bajar("pdf")} className={boton}>
          {pending ? "Preparando…" : "Descargar mis datos (PDF)"}
        </button>
        <button type="button" disabled={pending} onClick={() => bajar("json")} className={boton}>
          Descargar mis datos (JSON)
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
