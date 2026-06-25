import Link from "next/link";

import { iconoEspecie, labelEspecie, type Paciente } from "@/lib/types/db";

export function PacienteCard({ paciente }: { paciente: Paciente }) {
  return (
    <Link
      href={`/pacientes/${paciente.id}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-teal-300"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl">
        {iconoEspecie(paciente.especie)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{paciente.nombre}</p>
        <p className="truncate text-sm text-slate-500">
          {labelEspecie(paciente.especie)}
          {paciente.raza ? ` · ${paciente.raza}` : ""} · {paciente.numero_ficha}
        </p>
      </div>
    </Link>
  );
}
