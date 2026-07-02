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
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={cuando}
        onChange={(e) => setCuando(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
      />
      <button
        type="button"
        onClick={confirmar}
        disabled={busy}
        className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={rechazar}
        disabled={busy}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        Rechazar
      </button>
    </div>
  );
}
