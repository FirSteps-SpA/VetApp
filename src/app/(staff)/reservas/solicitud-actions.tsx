"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { controlClass } from "@/components/field";
import { cx } from "@/lib/utils/cx";
import { instanteEnZona, partesEnZona } from "@/lib/utils/zona";

import { confirmarSolicitud, rechazarSolicitud } from "./actions";

// Valor de <input type="datetime-local"> en hora de la clínica (no del navegador).
function toLocalInput(iso: string): string {
  const { fecha, hora } = partesEnZona(new Date(iso));
  return `${fecha}T${hora}`;
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
    const [fecha, hora] = cuando.split("T");
    const iso = instanteEnZona(fecha, hora).toISOString();
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
    <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center">
      <input
        type="datetime-local"
        value={cuando}
        onChange={(e) => setCuando(e.target.value)}
        className={cx(controlClass, "tablet:w-auto")}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={confirmar}
          disabled={busy}
          className="flex-1 tablet:flex-none"
        >
          Confirmar
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={rechazar}
          disabled={busy}
          className="flex-1 tablet:flex-none"
        >
          Rechazar
        </Button>
      </div>
    </div>
  );
}
