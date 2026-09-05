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
        className="grid h-tap w-tap place-items-center rounded-control text-lg leading-none text-text-muted hover:bg-surface-sunken"
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
          <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-card border border-border bg-surface-raised shadow-overlay">
            {items.map((a, i) => {
              const clase = `block w-full px-4 py-3 text-left text-body ${
                a.danger ? "text-danger" : "text-text"
              } hover:bg-surface-sunken disabled:opacity-50`;
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
