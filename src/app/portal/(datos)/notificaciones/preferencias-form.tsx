"use client";

import { useState } from "react";

import { guardarPreferencias, type Preferencias } from "./actions";

const OPCIONES: { key: keyof Preferencias; label: string }[] = [
  { key: "recordatorio_citas", label: "Recordatorios de citas" },
  { key: "recordatorio_vacunas", label: "Recordatorios de vacunas" },
  { key: "canal_email", label: "Recibir por email" },
  { key: "canal_push", label: "Recibir por notificación push" },
];

export function PreferenciasForm({ inicial }: { inicial: Preferencias }) {
  const [prefs, setPrefs] = useState<Preferencias>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  async function guardar() {
    setGuardando(true);
    setOk(false);
    const res = await guardarPreferencias(prefs);
    setGuardando(false);
    if (!res.error) setOk(true);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {OPCIONES.map((o) => (
          <label
            key={o.key}
            className="flex items-center gap-2 text-sm text-text"
          >
            <input
              type="checkbox"
              checked={prefs[o.key]}
              onChange={(e) => {
                setPrefs({ ...prefs, [o.key]: e.target.checked });
                setOk(false);
              }}
              className="h-4 w-4"
            />
            {o.label}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar preferencias"}
        </button>
        {ok && <span className="text-xs text-accent">Guardado ✓</span>}
      </div>
    </div>
  );
}
