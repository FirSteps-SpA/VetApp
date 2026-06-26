"use client";

import { useFormState, useFormStatus } from "react-dom";

import type { Dueno } from "@/lib/types/db";

import { actualizarDueno, type EditarDuenoState } from "../../actions";

const field =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const label = "flex flex-col gap-1 text-sm font-medium text-slate-700";

const initialState: EditarDuenoState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditDuenoForm({
  dueno,
  pacienteId,
}: {
  dueno: Dueno;
  pacienteId: string;
}) {
  const action = actualizarDueno.bind(null, dueno.id, pacienteId);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className={label}>
          Nombre *
          <input
            name="nombre"
            required
            defaultValue={dueno.nombre}
            className={field}
          />
        </label>
        <label className={label}>
          Teléfono *
          <input
            name="telefono"
            required
            inputMode="tel"
            defaultValue={dueno.telefono}
            className={field}
          />
        </label>
        <label className={label}>
          Email
          <input
            name="email"
            type="email"
            defaultValue={dueno.email ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Dirección
          <input
            name="direccion"
            defaultValue={dueno.direccion ?? ""}
            className={field}
          />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Notas internas
          <textarea
            name="notas"
            rows={3}
            defaultValue={dueno.notas ?? ""}
            className={field}
          />
        </label>
      </fieldset>

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
