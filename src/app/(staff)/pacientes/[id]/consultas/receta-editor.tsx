"use client";

import { useState } from "react";

import { Icon } from "@/components/icon";
import type { Medicamento } from "@/lib/types/db";

import type { RecetaInput } from "./actions";

// Bloque "Receta" de la nueva consulta y del control: medicamentos e
// instrucciones generales, plegado tras "Agregar receta". El estado vive en
// `useReceta` (en el formulario) para poder enviarlo y reiniciarlo.

const field =
  "w-full rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

interface MedRow extends Medicamento {
  key: number;
}

const emptyMed = (key: number): MedRow => ({
  key,
  nombre: "",
  presentacion: "",
  dosis: "",
  frecuencia: "",
  duracion: "",
  instrucciones: "",
});

export function useReceta() {
  const [conReceta, setConReceta] = useState(false);
  const [meds, setMeds] = useState<MedRow[]>([emptyMed(0)]);
  const [instrucciones, setInstrucciones] = useState("");

  return {
    conReceta,
    setConReceta,
    meds,
    setMeds,
    instrucciones,
    setInstrucciones,
    reset() {
      setConReceta(false);
      setMeds([emptyMed(0)]);
      setInstrucciones("");
    },
    // Para la server action: null si no se marcó "Agregar receta".
    aInput(): RecetaInput | null {
      if (!conReceta) return null;
      return {
        instrucciones_generales: instrucciones,
        medicamentos: meds.map((m) => ({
          nombre: m.nombre,
          presentacion: m.presentacion,
          dosis: m.dosis,
          frecuencia: m.frecuencia,
          duracion: m.duracion,
          instrucciones: m.instrucciones,
        })),
      };
    },
  };
}

export function RecetaEditor({ receta }: { receta: ReturnType<typeof useReceta> }) {
  const { conReceta, setConReceta, meds, setMeds, instrucciones, setInstrucciones } =
    receta;

  function updateMed(key: number, patch: Partial<Medicamento>) {
    setMeds((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <section className="space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Receta</h3>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={conReceta}
            onChange={(e) => setConReceta(e.target.checked)}
            className="h-4 w-4"
          />
          Agregar receta
        </label>
      </div>

      {conReceta && (
        <div className="space-y-3">
          {meds.map((m, i) => (
            <div
              key={m.key}
              className="space-y-2 rounded-control border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Medicamento {i + 1}
                </span>
                {meds.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setMeds((rows) => rows.filter((r) => r.key !== m.key))
                    }
                    className="text-xs text-danger hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <input
                placeholder="Nombre *"
                value={m.nombre}
                onChange={(e) => updateMed(m.key, { nombre: e.target.value })}
                className={field}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  placeholder="Presentación"
                  value={m.presentacion}
                  onChange={(e) =>
                    updateMed(m.key, { presentacion: e.target.value })
                  }
                  className={field}
                />
                <input
                  placeholder="Dosis"
                  value={m.dosis}
                  onChange={(e) => updateMed(m.key, { dosis: e.target.value })}
                  className={field}
                />
                <input
                  placeholder="Frecuencia"
                  value={m.frecuencia}
                  onChange={(e) =>
                    updateMed(m.key, { frecuencia: e.target.value })
                  }
                  className={field}
                />
                <input
                  placeholder="Duración"
                  value={m.duracion}
                  onChange={(e) => updateMed(m.key, { duracion: e.target.value })}
                  className={field}
                />
              </div>
              <input
                placeholder="Instrucciones"
                value={m.instrucciones}
                onChange={(e) =>
                  updateMed(m.key, { instrucciones: e.target.value })
                }
                className={field}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setMeds((rows) => [...rows, emptyMed((rows.at(-1)?.key ?? 0) + 1)])
            }
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Agregar medicamento
          </button>

          <label className={label}>
            Instrucciones generales
            <textarea
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              rows={2}
              className={field}
            />
          </label>
        </div>
      )}
    </section>
  );
}
