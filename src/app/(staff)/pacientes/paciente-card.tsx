import Link from "next/link";

import { iconoEspecie, labelEspecie, type Paciente } from "@/lib/types/db";

export function PacienteCard({ paciente }: { paciente: Paciente }) {
  return (
    <Link
      href={`/pacientes/${paciente.id}`}
      className="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-3 transition-colors hover:border-accent tablet:p-2.5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-surface-sunken text-xl">
        {iconoEspecie(paciente.especie)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-text">{paciente.nombre}</p>
        <p className="truncate text-support text-text-muted">
          {labelEspecie(paciente.especie)}
          {paciente.raza ? ` · ${paciente.raza}` : ""} · {paciente.numero_ficha}
        </p>
      </div>
    </Link>
  );
}
