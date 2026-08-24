"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import dynamic from "next/dynamic";

import type { ExportData } from "./export-panel";

// El panel (y @react-pdf/renderer) se cargan solo al abrir, fuera del SSR.
const ExportPanel = dynamic(() => import("./export-panel"), { ssr: false });

export function ExportButton({ data }: { data: ExportData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
      >
        <Icon name="printer" />
        Exportar
      </button>
      {open && <ExportPanel data={data} onClose={() => setOpen(false)} />}
    </>
  );
}
