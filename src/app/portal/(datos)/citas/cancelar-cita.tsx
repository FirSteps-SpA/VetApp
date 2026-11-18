"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelarCita } from "./actions";

// Botón de cancelación de una hora (spec 8), con motivo opcional.
export function CancelarCita({ citaId, descripcion }: { citaId: string; descripcion: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs font-medium text-danger hover:underline"
      >
        Cancelar
      </button>
    );
  }
  return (
    <div className="flex w-full flex-col gap-2 rounded-control border border-border bg-surface p-3">
      <p className="text-sm text-text">¿Cancelar la hora de {descripcion}?</p>
      <label className="flex flex-col gap-1 text-xs text-text-muted">
        Motivo (opcional)
        <input
          value={motivo}
          maxLength={500}
          onChange={(e) => setMotivo(e.target.value)}
          className="rounded-control border border-border bg-surface px-2 py-1.5 text-sm text-text"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelarCita(citaId, motivo);
              if (r.error) setError(r.error);
              else router.refresh();
            })
          }
          className="rounded-control bg-danger px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Cancelando…" : "Sí, cancelar la hora"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setAbierto(false)}
          className="rounded-control border border-border px-3 py-1.5 text-sm text-text"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
