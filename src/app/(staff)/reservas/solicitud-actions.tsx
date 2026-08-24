"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { confirmarSolicitud, rechazarSolicitud } from "./actions";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function SolicitudActions({
  citaId,
  fechaHora,
}: {
  citaId: string;
  fechaHora: string;
}) {
  const router = useRouter();
  const [cuando, setCuando] = useState(toLocalInput(fechaHora));
  const [busy, setBusy] = useState(false);

  async function confirmar() {
    setBusy(true);
    const iso = new Date(cuando).toISOString();
    const res = await confirmarSolicitud(citaId, iso);
    setBusy(false);
    if (res.error) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  async function rechazar() {
    const motivo = window.prompt("Motivo del rechazo (opcional):") ?? "";
    setBusy(true);
    const res = await rechazarSolicitud(citaId, motivo);
    setBusy(false);
    if (res.error) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="datetime-local"
        value={cuando}
        onChange={(e) => setCuando(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-auto"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={busy}
          className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:flex-none"
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={rechazar}
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 sm:flex-none"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
