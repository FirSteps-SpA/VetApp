"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@/components/action-menu";
import { Button, ButtonLink } from "@/components/button";
import type { EstadoCita } from "@/lib/types/db";

import { cambiarEstadoCita } from "./actions";

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
      <ButtonLink
        href={`/pacientes/${pacienteId}/consultas/${consultaId}`}
        variant="ghost"
        size="sm"
        className="text-accent"
      >
        Ver consulta
      </ButtonLink>
    ) : null;
  }

  if (estado === "cancelada" || estado === "no_asistio") return null;

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" onClick={iniciar} disabled={busy}>
        Iniciar consulta
      </Button>
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
