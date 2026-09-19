"use client";

import { useFormState, useFormStatus } from "react-dom";

import type { Dueno } from "@/lib/types/db";

import { actualizarDueno, type EditarDuenoState } from "../../actions";

const field =
  "rounded-control border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle";
const label = "flex flex-col gap-1 text-sm font-medium text-text";

const initialState: EditarDuenoState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-60"
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
      <fieldset className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
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
          RUT
          <input name="rut" defaultValue={dueno.rut ?? ""} className={field} />
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
        <label className={label}>
          Comuna
          <input
            name="comuna"
            defaultValue={dueno.comuna ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Sector
          <input
            name="sector"
            defaultValue={dueno.sector ?? ""}
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
        <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
