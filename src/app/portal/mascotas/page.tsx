import Link from "next/link";
import type { Metadata } from "next";

import { getMisMascotas } from "@/lib/data/portal";
import { iconoEspecie } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "Mis mascotas",
};

export default async function MisMascotasPage() {
  const mascotas = await getMisMascotas();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Mis mascotas</h1>
      {mascotas.length === 0 ? (
        <p className="text-sm text-slate-500">Sin mascotas asociadas.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {mascotas.map((m) => (
            <Link
              key={m.id}
              href={`/portal/mascotas/${m.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-teal-300"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-xl">
                {iconoEspecie(m.especie)}
              </span>
              <div>
                <p className="font-medium text-slate-800">{m.nombre}</p>
                <p className="text-xs text-slate-500">
                  {m.raza ?? m.especie} · {m.numero_ficha}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
