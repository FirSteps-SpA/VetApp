"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { EstadoCita } from "@/lib/types/db";

import { cambiarEstadoCita } from "./actions";

const btn =
  "rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50";

export function CitaActions({
  citaId,
  pacienteId,
  estado,
  consultaId,
}: {
  citaId: string;
  pacienteId: string;
  estado: EstadoCita;
  consultaId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cambiar(nuevo: EstadoCita) {
    setBusy(true);
    const res = await cambiarEstadoCita(citaId, nuevo);
    setBusy(false);
    if (res.error) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  async function iniciar() {
    setBusy(true);
    await cambiarEstadoCita(citaId, "en_consulta");
    router.push(`/pacientes/${pacienteId}?cita=${citaId}`);
  }

  if (estado === "realizada") {
    return consultaId ? (
      <Link
        href={`/pacientes/${pacienteId}/consultas/${consultaId}`}
        className={`${btn} text-teal-700 hover:bg-teal-50`}
      >
        Ver consulta
      </Link>
    ) : null;
  }

  if (estado === "cancelada" || estado === "no_asistio") return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {estado === "pendiente" && (
        <button
          onClick={() => cambiar("confirmada")}
          disabled={busy}
          className={`${btn} text-blue-700 hover:bg-blue-50`}
        >
          Confirmar
        </button>
      )}
      <button
        onClick={iniciar}
        disabled={busy}
        className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}
      >
        Iniciar consulta
      </button>
      <button
        onClick={() => cambiar("no_asistio")}
        disabled={busy}
        className={`${btn} text-slate-600 hover:bg-slate-100`}
      >
        No asistió
      </button>
      <button
        onClick={() => cambiar("cancelada")}
        disabled={busy}
        className={`${btn} text-red-600 hover:bg-red-50`}
      >
        Cancelar
      </button>
    </div>
  );
}
