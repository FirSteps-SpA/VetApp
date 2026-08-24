"use client";

import { useState } from "react";
import Link from "next/link";

export interface Accion {
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

// Menú de desbordamiento "⋯" para agrupar acciones secundarias de una fila.
// Botón con target táctil cómodo; cierra al elegir una acción o al tocar fuera.
export function ActionMenu({ acciones }: { acciones: Accion[] }) {
  const [open, setOpen] = useState(false);
  const items = acciones.filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Más acciones"
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-lg text-lg leading-none text-slate-500 hover:bg-slate-100"
      >
        ⋯
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {items.map((a, i) => {
              const clase = `block w-full px-4 py-3 text-left text-sm ${
                a.danger ? "text-red-600" : "text-slate-700"
              } hover:bg-slate-50 disabled:opacity-50`;
              if (a.href) {
                return (
                  <Link
                    key={i}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className={clase}
                  >
                    {a.label}
                  </Link>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={a.disabled}
                  onClick={() => {
                    setOpen(false);
                    a.onClick?.();
                  }}
                  className={clase}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
