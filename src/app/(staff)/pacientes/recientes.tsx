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
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Vistos recientemente
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/pacientes/${p.id}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm transition-colors hover:border-teal-300"
          >
            <span>{iconoEspecie(p.especie)}</span>
            <span className="font-medium text-slate-700">{p.nombre}</span>
            <span className="text-slate-400">{p.numero_ficha}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
