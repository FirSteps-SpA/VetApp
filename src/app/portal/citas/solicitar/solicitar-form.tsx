"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { MascotaPortal } from "@/lib/data/portal";
import { isoDia } from "@/lib/utils/format";

import { solicitarCita } from "../actions";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

export function SolicitarForm({ mascotas }: { mascotas: MascotaPortal[] }) {
  const router = useRouter();
  const [pacienteId, setPacienteId] = useState(mascotas[0]?.id ?? "");
  const [fecha, setFecha] = useState(isoDia(new Date()));
  const [hora, setHora] = useState("10:00");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function enviar() {
    setEnviando(true);
    setError(null);
    const res = await solicitarCita({ pacienteId, fecha, hora, motivo });
    setEnviando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOk(true);
    router.refresh();
  }

  if (mascotas.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No tienes mascotas asociadas para solicitar una hora.
      </p>
    );
  }

  if (ok) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
        ¡Solicitud enviada! El veterinario la revisará y confirmará el horario.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className={label}>
          Mascota
          <select
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            className={field}
          >
            {mascotas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>
            Fecha preferida
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            Hora preferida
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={field}
            />
          </label>
        </div>
        <label className={label}>
          Motivo
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            className={field}
          />
        </label>
        <p className="text-xs text-slate-400">
          La fecha y hora son una preferencia; el veterinario confirmará el
          horario definitivo.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Solicitar hora"}
        </button>
      </div>
    </div>
  );
}
