"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/action-menu";
import type { EstadoCita } from "@/lib/types/db";

import { cambiarEstadoCita } from "./actions";

const btn =
  "rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50";

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
    <div className="flex items-center gap-1">
      <button
        onClick={iniciar}
        disabled={busy}
        className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}
      >
        Iniciar consulta
      </button>
      <ActionMenu
        acciones={[
          ...(estado === "pendiente"
            ? [
                {
                  label: "Confirmar",
                  disabled: busy,
                  onClick: () => cambiar("confirmada"),
                },
              ]
            : []),
          {
            label: "No asistió",
            disabled: busy,
            onClick: () => cambiar("no_asistio"),
          },
          {
            label: "Cancelar",
            danger: true,
            disabled: busy,
            onClick: () => cambiar("cancelada"),
          },
        ]}
      />
    </div>
  );
}
