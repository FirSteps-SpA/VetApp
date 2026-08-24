"use client";

import { useState } from "react";

// Botón "tonto" de impresión: maneja el estado ocupado y delega en `onClick`
// (que hace el import() dinámico y genera el documento).
export function PrintButton({
  onClick,
  label = "Imprimir",
  className,
}: {
  onClick: () => Promise<void>;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
      className={
        className ??
        "text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
      }
    >
      {busy ? "Preparando…" : label}
    </button>
  );
}
