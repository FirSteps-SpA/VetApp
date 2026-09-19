"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import type { DocumentosData } from "./documentos-panel";

// El panel (y los motores de PDF) se cargan solo al abrir, fuera del SSR, para
// no engrosar el bundle de la ficha.
const DocumentosPanel = dynamic(() => import("./documentos-panel"), {
  ssr: false,
});

export function DocumentosButton({
  data,
  className,
}: {
  data: DocumentosData;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex w-full items-center justify-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-sunken"
        }
      >
        Documentos
      </button>
      {open && <DocumentosPanel data={data} onClose={() => setOpen(false)} />}
    </>
  );
}
