"use client";

import { useState } from "react";

interface TabDef {
  id: string;
  label: string;
  fase?: number; // si está definido, el contenido llega en esa fase
}

const TABS: TabDef[] = [
  { id: "resumen", label: "Resumen" },
  { id: "historial", label: "Historial", fase: 3 },
  { id: "recetas", label: "Recetas", fase: 3 },
  { id: "examenes", label: "Exámenes", fase: 4 },
  { id: "vacunas", label: "Vacunas", fase: 6 },
  { id: "citas", label: "Citas", fase: 6 },
];

export function FichaTabs({ notas }: { notas: string | null }) {
  const [active, setActive] = useState("resumen");
  const current = TABS.find((t) => t.id === active);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-4">
        {active === "resumen" ? (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-700">
              Observaciones generales
            </h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {notas?.trim() || "Sin observaciones registradas."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {current?.label} — se incorpora en la Fase {current?.fase}.
          </div>
        )}
      </div>
    </div>
  );
}
