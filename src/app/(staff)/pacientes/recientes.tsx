"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getRecientes, type PacienteReciente } from "@/lib/recent";
import { iconoEspecie } from "@/lib/types/db";

export function Recientes() {
  const [items, setItems] = useState<PacienteReciente[]>([]);

  useEffect(() => {
    setItems(getRecientes());
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-support font-semibold uppercase tracking-wide text-text-muted">
        Vistos recientemente
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/pacientes/${p.id}`}
            className="flex min-h-tap shrink-0 items-center gap-2 rounded-pill border border-border bg-surface px-3 text-body transition-colors hover:border-accent"
          >
            <span>{iconoEspecie(p.especie)}</span>
            <span className="font-medium text-text">{p.nombre}</span>
            <span className="text-text-muted">{p.numero_ficha}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
