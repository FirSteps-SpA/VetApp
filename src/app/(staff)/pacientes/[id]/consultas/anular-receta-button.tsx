"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { anularReceta } from "./actions";

export function AnularRecetaButton({
  recetaId,
  pacienteId,
}: {
  recetaId: string;
  pacienteId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm("¿Anular esta receta? No se elimina, queda como histórico."))
      return;
    setBusy(true);
    const res = await anularReceta(recetaId, pacienteId);
    setBusy(false);
    if (res.error) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {busy ? "Anulando…" : "Anular"}
    </button>
  );
}
