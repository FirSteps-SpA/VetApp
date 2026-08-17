"use client";

import { useFormState, useFormStatus } from "react-dom";

import type { ClinicaConfig } from "@/lib/types/db";

import { guardarClinica } from "./actions";

const field =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar datos"}
    </button>
  );
}

export function ClinicaForm({ config }: { config: ClinicaConfig }) {
  const [state, action] = useFormState(guardarClinica, { error: null });

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Nombre de la clínica *
          <input
            name="nombre_clinica"
            required
            defaultValue={config.nombre_clinica}
            className={field}
          />
        </label>
        <label className={label}>
          Número de registro
          <input
            name="numero_registro"
            defaultValue={config.numero_registro ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Dirección
          <input
            name="direccion"
            defaultValue={config.direccion ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Ciudad
          <input
            name="ciudad"
            defaultValue={config.ciudad ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Teléfono
          <input
            name="telefono"
            defaultValue={config.telefono ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Email
          <input
            name="email"
            type="email"
            defaultValue={config.email ?? ""}
            className={field}
          />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
